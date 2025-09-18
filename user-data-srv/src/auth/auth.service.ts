import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CacheRedisService } from '../redis/redis.service';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  constructor(
    private httpService: HttpService,
    private redis: CacheRedisService
  ) {}

  getDiscordAuthUrl(): string {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.API_URL}/auth/discord/callback`);
    const scope = encodeURIComponent('identify email');
    
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  }

  async handleDiscordCallback(code: string): Promise<{ token: string; user: User }> {
    try {
      // Exchange code for access token
      const tokenResponse = await firstValueFrom(
        this.httpService.post('https://discord.com/api/oauth2/token', {
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${process.env.API_URL}/auth/discord/callback`
        }, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      // Get user info
      const userResponse = await firstValueFrom(
        this.httpService.get('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        })
      );

      const discordUser = userResponse.data;
      const user: User = {
        id: discordUser.id,
        username: discordUser.username,
        email: discordUser.email,
        avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
        provider: 'discord',
        createdAt: new Date().toISOString()
      };

      // Save user to database/cache
      await this.saveUser(user);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, { expiresIn: '7d' });

      return { token, user };
    } catch (error) {
      this.logger.error('Discord auth error:', error);
      throw new Error('Discord authentication failed');
    }
  }

  getSteamAuthUrl(): string {
    const returnUrl = encodeURIComponent(`${process.env.API_URL}/auth/steam/callback`);
    return `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${returnUrl}&openid.realm=${process.env.API_URL}&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;
  }

  async handleSteamCallback(query: any): Promise<{ token: string; user: User }> {
    // Steam OpenID validation logic here
    // This is a simplified version - implement proper OpenID validation
    const steamId = this.extractSteamId(query['openid.claimed_id']);
    
    if (!steamId) {
      throw new Error('Invalid Steam authentication');
    }

    // Get Steam user data
    const steamResponse = await firstValueFrom(
      this.httpService.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`)
    );

    const steamUser = steamResponse.data.response.players[0];
    const user: User = {
      id: steamUser.steamid,
      username: steamUser.personaname,
      email: '', // Steam doesn't provide email
      avatar: steamUser.avatarfull,
      provider: 'steam',
      createdAt: new Date().toISOString()
    };

    await this.saveUser(user);
    const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, { expiresIn: '7d' });

    return { token, user };
  }

  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.API_URL}/auth/google/callback`);
    const scope = encodeURIComponent('openid email profile');
    
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  }

  async handleGoogleCallback(code: string): Promise<{ token: string; user: User }> {
    try {
      // Exchange code for access token
      const tokenResponse = await firstValueFrom(
        this.httpService.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${process.env.API_URL}/auth/google/callback`
        })
      );

      // Get user info
      const userResponse = await firstValueFrom(
        this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        })
      );

      const googleUser = userResponse.data;
      const user: User = {
        id: googleUser.id,
        username: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        provider: 'google',
        createdAt: new Date().toISOString()
      };

      await this.saveUser(user);
      const token = jwt.sign({ userId: user.id }, this.JWT_SECRET, { expiresIn: '7d' });

      return { token, user };
    } catch (error) {
      this.logger.error('Google auth error:', error);
      throw new Error('Google authentication failed');
    }
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const user = await this.redis.getFromCache(`user:${decoded.userId}`, true);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  private async saveUser(user: User): Promise<void> {
    await this.redis.saveInCache(`user:${user.id}`, 86400 * 7, user); // 7 days
  }

  private extractSteamId(claimedId: string): string | null {
    const match = claimedId.match(/\/id\/(\d+)$/);
    return match ? match[1] : null;
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  provider: 'discord' | 'steam' | 'google';
  createdAt: string;
}
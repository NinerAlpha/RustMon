import { Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) {}

  @Get('discord')
  discordAuth(@Res() res: Response) {
    const discordAuthUrl = this.authService.getDiscordAuthUrl();
    res.redirect(discordAuthUrl);
  }

  @Get('discord/callback')
  async discordCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleDiscordCallback(code);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  @Get('steam')
  steamAuth(@Res() res: Response) {
    const steamAuthUrl = this.authService.getSteamAuthUrl();
    res.redirect(steamAuthUrl);
  }

  @Get('steam/callback')
  async steamCallback(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.authService.handleSteamCallback(query);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  @Get('google')
  googleAuth(@Res() res: Response) {
    const googleAuthUrl = this.authService.getGoogleAuthUrl();
    res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleGoogleCallback(code);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req: Request) {
    // Invalidate token logic here
    return { success: true };
  }
}
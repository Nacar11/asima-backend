import {
  Controller,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CsrfService } from './services/csrf.service';
import { randomBytes } from 'crypto';

@ApiTags('Account Deletion')
@Controller({
  path: 'account-deletion-requests',
  version: '1',
})
export class AccountDeletionCsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get CSRF token for account deletion requests' })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated successfully',
  })
  getCsrfToken(@Req() req: Request, @Res() res: Response): void {
    // Generate or retrieve session ID
    let sessionId = req.cookies?.['csrf_session'];

    if (!sessionId) {
      sessionId = randomBytes(32).toString('hex');
      // Set session cookie (httpOnly, secure in production)
      res.cookie('csrf_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
      });
    }

    // Generate CSRF token
    const csrfToken = this.csrfService.generateToken(sessionId);

    res.json({
      csrf_token: csrfToken,
      expires_in_seconds: 3600,
    });
  }
}

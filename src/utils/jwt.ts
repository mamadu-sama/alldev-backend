import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
}

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (userId: string, tokenId: string): string => {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    jti: tokenId,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};


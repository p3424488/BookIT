import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { RegisterInput, LoginInput } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'bookit-secret-key';
const JWT_EXPIRES_IN = '7d';

// ─── REGISTER ───────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, city }: RegisterInput = req.body;

    // Step 1 — Check all required fields are present
    if (!name || !email || !password) {
      res.status(400).json({ 
        message: 'Name, email and password are required' 
      });
      return;
    }

    // Step 2 — Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ 
        message: 'Email already registered' 
      });
      return;
    }

    // Step 3 — Encrypt the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Step 4 — Save user to database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        city,
      },
    });

    // Step 5 — Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Step 6 — Send response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
      },
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── LOGIN ──────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginInput = req.body;

    // Step 1 — Check all required fields
    if (!email || !password) {
      res.status(400).json({ 
        message: 'Email and password are required' 
      });
      return;
    }

    // Step 2 — Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(400).json({ 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Step 3 — Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      res.status(400).json({ 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Step 4 — Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Step 5 — Send response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
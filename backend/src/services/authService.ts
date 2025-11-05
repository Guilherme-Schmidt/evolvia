import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'evolvia_secret'; // Troque depois por uma variável real

// Função de cadastro
export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('E-mail já cadastrado');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    message: 'Usuário criado com sucesso!',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    },
  };
}

// Função de login
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Usuário não encontrado');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Senha incorreta');

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    message: 'Login realizado com sucesso!',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    },
  };
}

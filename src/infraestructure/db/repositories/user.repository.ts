import { UsuarioModel } from '../models/user.model';

export interface UsuarioData {
  name?: string;
  email?: string;
  passwordHash?: string;
}

export const findAll = async () => {
  return UsuarioModel.find();
};

export const findById = async (id: string) => {
  return UsuarioModel.findById(id);
};

export const findByEmail = async (email: string) => {
  return UsuarioModel.findOne({ email: email.trim().toLowerCase() }).select(
    '+passwordHash'
  );
};

export const insert = async (data: UsuarioData) => {
  return UsuarioModel.create(data);
};

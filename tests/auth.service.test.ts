import assert from "node:assert/strict";
import test from "node:test";
import type {
  PasswordService,
  TokenService,
  UserRepository,
} from "../src/domain/ports/repository-ports";
import { AuthService } from "../src/domain/services/auth.service";
import { ServiceError } from "../src/domain/services/service-error";
import { makeUser } from "./fixtures";

test("normaliza el correo, recorta el nombre y guarda solo el hash de la contraseña", async () => {
  let savedEmail = "";
  let savedName = "";
  let savedPasswordHash = "";
  const user = makeUser();
  const users: UserRepository = {
    findByEmail: async (email) =>
      email.value === "usuario@example.com" ? null : null,
    create: async (input) => {
      savedEmail = input.email.value;
      savedName = input.name;
      savedPasswordHash = input.passwordHash;
      return { ...user, ...input };
    },
    findById: async () => user,
  };
  const passwords: PasswordService = {
    hash: async (password) => `hash:${password}`,
    verify: async (password, passwordHash) =>
      passwordHash === `hash:${password}`,
  };
  const tokens: TokenService = {
    create: (userId) => `token:${userId}`,
    verify: () => null,
  };
  const service = new AuthService(users, passwords, tokens);

  const result = await service.register(
    "  Ana  ",
    " USUARIO@EXAMPLE.COM ",
    "secret",
  );

  assert.deepEqual(result, {
    id: user.id,
    name: "Ana",
    email: user.email,
  });
  assert.equal(savedEmail, "usuario@example.com");
  assert.equal(savedName, "Ana");
  assert.equal(savedPasswordHash, "hash:secret");
});

test("rechaza correos duplicados y no revela cuáles credenciales son incorrectas", async () => {
  const user = makeUser();
  const users: UserRepository = {
    findByEmail: async () => user,
    create: async (input) => ({ ...user, ...input }),
    findById: async () => user,
  };
  const passwords: PasswordService = {
    hash: async (password) => `hash:${password}`,
    verify: async () => false,
  };
  const tokens: TokenService = { create: () => "token", verify: () => null };
  const service = new AuthService(users, passwords, tokens);

  await assert.rejects(
    service.register("Ana", "usuario@example.com", "secret"),
    {
      code: "EMAIL_ALREADY_EXISTS",
    },
  );
  await assert.rejects(service.login("usuario@example.com", "wrong"), {
    code: "INVALID_CREDENTIALS",
  });
  await assert.rejects(service.login("invalid-email", "wrong"), {
    code: "INVALID_CREDENTIALS",
  });
});

test("entrega un token cuando las credenciales son válidas", async () => {
  const user = makeUser();
  const users: UserRepository = {
    findByEmail: async () => user,
    create: async (input) => ({ ...user, ...input }),
    findById: async () => user,
  };
  const passwords: PasswordService = {
    hash: async (password) => password,
    verify: async (password, passwordHash) =>
      passwordHash === "stored-hash" && password === "secret",
  };
  const tokens: TokenService = {
    create: (userId) => `token:${userId}`,
    verify: () => null,
  };
  const service = new AuthService(users, passwords, tokens);

  assert.deepEqual(await service.login("usuario@example.com", "secret"), {
    token: "token:user-1",
  });
});

test("rechaza el registro cuando faltan campos requeridos", async () => {
  const service = new AuthService(
    {
      findByEmail: async () => null,
      create: async (input) => ({ ...makeUser(), ...input }),
      findById: async () => null,
    },
    { hash: async () => "hash", verify: async () => false },
    { create: () => "token", verify: () => null },
  );

  await assert.rejects(
    service.register(" ", "user@example.com", "secret"),
    (error) => {
      assert.ok(error instanceof ServiceError);
      assert.equal(error.statusCode, 400);
      return true;
    },
  );
});

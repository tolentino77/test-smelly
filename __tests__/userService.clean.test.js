const { UserService } = require('../src/userService');

const dadosUsuarioPadrao = {
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
};

// Fábrica de dados: evita repetição e deixa explícito, em cada teste,
// apenas o que é relevante para o cenário.
const criarUsuario = (service, sobrescritas = {}) => {
  const { nome, email, idade, isAdmin } = { ...dadosUsuarioPadrao, ...sobrescritas };
  return service.createUser(nome, email, idade, isAdmin);
};

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('deve retornar um usuário com id definido ao criar com dados válidos', () => {
      // Arrange
      const { nome, email, idade } = dadosUsuarioPadrao;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.id).toBeDefined();
    });

    test('deve criar o usuário com status "ativo" por padrão', () => {
      // Arrange
      const { nome, email, idade } = dadosUsuarioPadrao;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.status).toBe('ativo');
    });

    test('deve criar o usuário como não administrador por padrão', () => {
      // Arrange
      const { nome, email, idade } = dadosUsuarioPadrao;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.isAdmin).toBe(false);
    });

    test('deve lançar erro ao criar usuário menor de idade', () => {
      // Arrange
      const idadeMenor = 17;

      // Act
      const criarMenorDeIdade = () => criarUsuario(userService, { idade: idadeMenor });

      // Assert
      expect(criarMenorDeIdade).toThrow('O usuário deve ser maior de idade.');
    });

    test('deve lançar erro ao criar usuário sem nome', () => {
      // Arrange
      const nomeVazio = '';

      // Act
      const criarSemNome = () => criarUsuario(userService, { nome: nomeVazio });

      // Assert
      expect(criarSemNome).toThrow('Nome, email e idade são obrigatórios.');
    });
  });

  describe('getUserById', () => {
    test('deve retornar o usuário criado quando o id existe', () => {
      // Arrange
      const usuarioCriado = criarUsuario(userService);

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado).toEqual(usuarioCriado);
    });

    test('deve retornar o nome correto ao buscar um usuário criado', () => {
      // Arrange
      const usuarioCriado = criarUsuario(userService);

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado.nome).toBe(dadosUsuarioPadrao.nome);
    });

    test('deve retornar null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.getUserById(idInexistente);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('deve retornar true ao desativar um usuário comum', () => {
      // Arrange
      const usuarioComum = criarUsuario(userService, { isAdmin: false });

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    test('deve alterar o status para "inativo" ao desativar um usuário comum', () => {
      // Arrange
      const usuarioComum = criarUsuario(userService, { isAdmin: false });

      // Act
      userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(userService.getUserById(usuarioComum.id).status).toBe('inativo');
    });

    test('deve retornar false ao tentar desativar um administrador', () => {
      // Arrange
      const usuarioAdmin = criarUsuario(userService, { isAdmin: true });

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    test('deve manter o status "ativo" de um administrador após tentativa de desativação', () => {
      // Arrange
      const usuarioAdmin = criarUsuario(userService, { isAdmin: true });

      // Act
      userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(userService.getUserById(usuarioAdmin.id).status).toBe('ativo');
    });

    test('deve retornar false ao tentar desativar um usuário inexistente', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('deve incluir o nome de cada usuário cadastrado no relatório', () => {
      // Arrange
      criarUsuario(userService, { nome: 'Alice', email: 'alice@email.com' });
      criarUsuario(userService, { nome: 'Bob', email: 'bob@email.com' });

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toEqual(expect.stringContaining('Alice'));
      expect(relatorio).toEqual(expect.stringContaining('Bob'));
    });

    test('deve incluir o id do usuário cadastrado no relatório', () => {
      // Arrange
      const usuario = criarUsuario(userService, { nome: 'Alice', email: 'alice@email.com' });

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain(usuario.id);
    });

    test('deve refletir o status atual do usuário no relatório', () => {
      // Arrange
      const usuario = criarUsuario(userService);
      userService.deactivateUser(usuario.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('inativo');
    });

    test('deve informar que não há usuários quando o banco está vazio', () => {
      // Arrange: nenhum usuário criado (banco limpo no beforeEach)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });
  });
});

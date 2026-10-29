const request = require('supertest');
const { io: createClient } = require('socket.io-client');
const validation = require('../../libs/unalib');
const { createServer } = require('../../server');

describe('Integración: backend de chat y una-lib', () => {
  let server;
  let baseUrl;
  let client;

  beforeAll(async () => {
    server = createServer();
    await new Promise((resolve) => server.http.listen(0, '127.0.0.1', resolve));
    const address = server.http.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    if (client) {
      client.close();
      client = null;
    }
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.io.close(resolve));
      server = null;
    }
  });

  async function sendChatMessage(message) {
    client = createClient(baseUrl, {
      forceNew: true,
      transports: ['websocket'],
      reconnection: false
    });

    await new Promise((resolve, reject) => {
      client.once('connect', resolve);
      client.once('connect_error', reject);
    });

    const response = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No llegó respuesta del backend')), 3000);
      client.once('Evento-Mensaje-Server', (payload) => {
        clearTimeout(timeout);
        resolve(JSON.parse(payload));
      });
    });

    client.emit('Evento-Mensaje-Server', JSON.stringify(message));
    return response;
  }

  test('GET / responde con la página real del chat', async () => {
    const response = await request(server.app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Chat Socket.IO UNA');
  });

  test('acepta una URL de imagen y una-lib la clasifica como imagen', async () => {
    const validateSpy = jest.spyOn(validation, 'validateMessage');
    const response = await sendChatMessage({
      nombre: 'Ana',
      mensaje: 'https://images.example/foto.jpg',
      color: '#336699'
    });

    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      nombre: 'Ana',
      mensaje: 'https://images.example/foto.jpg',
      tipo: 'imagen'
    });
    validateSpy.mockRestore();
  });

  test('acepta una URL de video y devuelve el ID para el reproductor', async () => {
    const response = await sendChatMessage({
      nombre: 'Luis',
      mensaje: 'https://youtu.be/qYwlqx-JLok',
      color: '#336699'
    });

    expect(response.tipo).toBe('video');
    expect(response.videoId).toBe('qYwlqx-JLok');
  });

  test('sanea scripts y no acepta una URL no permitida como multimedia', async () => {
    const scriptResponse = await sendChatMessage({
      nombre: 'Eva',
      mensaje: '<script>alert("xss")</script>Hola',
      color: '#336699'
    });

    expect(scriptResponse.tipo).toBe('texto');
    expect(scriptResponse.mensaje).toBe('Hola');
    expect(scriptResponse.mensaje).not.toMatch(/<script|alert/i);

    const invalidUrlResponse = await sendChatMessage({
      nombre: 'Eva',
      mensaje: 'javascript:alert(1)',
      color: '#336699'
    });

    expect(invalidUrlResponse.tipo).toBe('texto');
    expect(invalidUrlResponse.mensaje).toBe('javascript:alert(1)');
  });
});

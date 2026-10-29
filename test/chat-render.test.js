var assert = require('assert');
var fs = require('fs');
var path = require('path');
var JSDOM = require('jsdom').JSDOM;

describe('Feature: Renderizado de contenido compartido en el chat', function(){
  var dom;
  var messageHandler;

  beforeEach(function(){
    var html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    var inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(inlineScript, 'La página debe incluir el manejador del chat');

    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost:3000' });
    var window = dom.window;
    window.scrollTo = function() {};
    var socket = {
      on: function(eventName, handler){
        if (eventName === 'Evento-Mensaje-Server') {
          messageHandler = handler;
        }
      },
      emit: function() {}
    };

    window.io = function(){ return socket; };
    window.$ = function(selectorOrCallback){
      if (typeof selectorOrCallback === 'function') {
        selectorOrCallback();
        return;
      }
      if (selectorOrCallback === '#messages') {
        return { append: function(node){ window.document.querySelector('#messages').appendChild(node); } };
      }
      return { submit: function() {} };
    };

    window.eval(inlineScript[1]);
    assert.equal(typeof messageHandler, 'function');
  });

  afterEach(function(){
    dom.window.close();
    messageHandler = null;
  });

  it('Then una URL de imagen se muestra como elemento img', function(){
    messageHandler(JSON.stringify({
      nombre: 'Ana',
      mensaje: 'https://example.com/foto.jpg',
      color: '#336699',
      tipo: 'imagen'
    }));

    var image = dom.window.document.querySelector('#messages img');
    assert.ok(image);
    assert.equal(image.src, 'https://example.com/foto.jpg');
    assert.equal(image.alt, 'Imagen compartida en el chat');
  });

  it('Then una URL de video válida se muestra en un reproductor de YouTube', function(){
    messageHandler(JSON.stringify({
      nombre: 'Luis',
      mensaje: 'https://youtu.be/qYwlqx-JLok',
      videoId: 'qYwlqx-JLok',
      color: '#336699',
      tipo: 'video'
    }));

    var player = dom.window.document.querySelector('#messages iframe');
    assert.ok(player);
    assert.equal(player.src, 'https://www.youtube-nocookie.com/embed/qYwlqx-JLok');
    assert.equal(player.title, 'Video de YouTube compartido en el chat');
    assert.equal(player.allowFullscreen, true);
  });

  it('Then un mensaje con HTML malicioso queda como texto y no crea elementos', function(){
    messageHandler(JSON.stringify({
      nombre: 'Eva',
      mensaje: '<img src=x onerror=alert(1)><script>window.xssExecuted=true</script>',
      color: '#336699',
      tipo: 'texto'
    }));

    var message = dom.window.document.querySelector('#messages li');
    assert.ok(message);
    assert.equal(message.querySelector('img'), null);
    assert.equal(message.querySelector('script'), null);
    assert.equal(dom.window.xssExecuted, undefined);
    assert.ok(message.textContent.includes('<img src=x onerror=alert(1)>'));
  });

  it('Then un ID de video inválido no crea un reproductor', function(){
    messageHandler(JSON.stringify({
      nombre: 'Luis',
      mensaje: 'https://youtube.com/',
      videoId: 'bad-id',
      color: '#336699',
      tipo: 'video'
    }));

    assert.equal(dom.window.document.querySelector('#messages iframe'), null);
    assert.ok(dom.window.document.querySelector('#messages li').textContent.includes('https://youtube.com/'));
  });
});
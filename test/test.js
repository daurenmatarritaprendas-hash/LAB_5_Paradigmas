var val = require('../libs/unalib');
var assert = require('assert');


describe('unalib', function(){


  describe('funcion is_valid_phone', function(){

    it('deberia devolver true para 8297-8547', function(){

      assert.equal(val.is_valid_phone('8297-8547'), true);

    });

    it('deberia devolver false para 8297p-8547', function(){

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function(){

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });
    
  });

  describe('funcion is_valid_yt_video', function(){

    it('deberia devolver true para http://image.com/image.jpg', function(){

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

  });

  describe('Feature: Compartir URLs en el chat', function(){

    describe('Scenario: Un usuario comparte una imagen', function(){
      var resultado;

      before(function(){
        var mensaje = { nombre: 'Ana', mensaje: 'https://image.com/photo.png', color: '#336699' };
        resultado = JSON.parse(val.validateMessage(JSON.stringify(mensaje)));
      });

      it('Given una URL de imagen válida', function(){
        assert.equal(val.is_valid_url_image(resultado.mensaje), true);
      });

      it('When el servidor procesa el mensaje', function(){
        assert.equal(resultado.tipo, 'imagen');
      });

      it('Then el chat recibe una imagen para mostrar', function(){
        assert.equal(resultado.mensaje, 'https://image.com/photo.png');
      });
    });

    describe('Scenario: Un usuario comparte una imagen de Bing', function(){
      var resultado;

      before(function(){
        var mensaje = {
          nombre: 'Ana',
          mensaje: 'https://th.bing.com/th/id/R.74a177123729cb9f830ee74e89c7d0a8?rik=MERFceGckGmW1A&riu=http%3a%2f%2fwww.anipedia.net%2fimages%2ffondos-animales-conejos.jpg&ehk=abc',
          color: '#336699'
        };
        resultado = JSON.parse(val.validateMessage(JSON.stringify(mensaje)));
      });

      it('Given una miniatura de Bing con una URL de imagen en riu', function(){
        assert.equal(val.is_valid_url_image(resultado.mensaje), true);
      });

      it('When el servidor procesa el mensaje', function(){
        assert.equal(resultado.tipo, 'imagen');
      });

      it('Then el chat conserva el enlace para cargar la imagen', function(){
        assert.equal(resultado.mensaje.startsWith('https://th.bing.com/'), true);
      });
    });

    describe('Scenario: Un usuario comparte un video de YouTube', function(){
      var resultado;

      before(function(){
        var mensaje = { nombre: 'Luis', mensaje: 'https://youtu.be/qYwlqx-JLok', color: '#336699' };
        resultado = JSON.parse(val.validateMessage(JSON.stringify(mensaje)));
      });

      it('Given una URL válida de YouTube', function(){
        assert.equal(val.is_valid_yt_video(resultado.mensaje), true);
      });

      it('When el servidor procesa el mensaje', function(){
        assert.equal(resultado.tipo, 'video');
      });

      it('Then el chat recibe el identificador para insertar el reproductor', function(){
        assert.equal(resultado.videoId, 'qYwlqx-JLok');
      });
    });

    describe('Scenario: Un usuario comparte la portada de YouTube sin seleccionar un video', function(){
      var resultado;

      before(function(){
        resultado = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: 'https://www.youtube.com/' })));
      });

      it('Given una URL de YouTube sin identificador de video', function(){
        assert.equal(val.is_valid_yt_video(resultado.mensaje), false);
      });

      it('When el servidor procesa el mensaje', function(){
        assert.equal(resultado.tipo, 'texto');
      });

      it('Then no se intenta crear un reproductor vacío', function(){
        assert.equal(Object.prototype.hasOwnProperty.call(resultado, 'videoId'), false);
      });
    });

    describe('Scenario: Un usuario envía texto normal', function(){
      var resultado;

      before(function(){
        resultado = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: 'Hola chat' })));
      });

      it('Given un mensaje que no contiene una URL multimedia', function(){
        assert.equal(resultado.mensaje, 'Hola chat');
      });

      it('When el servidor procesa el mensaje', function(){
        assert.equal(resultado.tipo, 'texto');
      });

      it('Then el texto queda disponible para mostrarse en el chat', function(){
        assert.equal(resultado.mensaje, 'Hola chat');
      });
    });

  });

  describe('Feature: Mensajes seguros', function(){

    it('deberia eliminar etiquetas y contenido de scripts', function(){
      var result = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: '<img src=x onerror=alert(1)>Ana',
        mensaje: '<script>alert("xss")</script><b>Hola</b>'
      })));

      assert.equal(result.nombre, 'Ana');
      assert.equal(result.mensaje, 'Hola');
      assert.equal(result.tipo, 'texto');
    });

    it('deberia eliminar el contenido de un script sin etiqueta de cierre', function(){
      var result = JSON.parse(val.validateMessage(JSON.stringify({
        mensaje: 'antes<script>alert("xss")'
      })));

      assert.equal(result.mensaje, 'antes');
      assert.equal(result.mensaje.includes('alert'), false);
    });

    it('deberia descartar propiedades no permitidas y validar el color', function(){
      var result = JSON.parse(val.validateMessage(JSON.stringify({
        nombre: 'Luis',
        mensaje: 'Hola',
        color: 'red; background:url(javascript:alert(1))',
        html: '<script>alert(1)</script>'
      })));

      assert.equal(result.color, '#222222');
      assert.equal(Object.prototype.hasOwnProperty.call(result, 'html'), false);
    });

    it('no deberia aceptar esquemas ni hosts falsos como URL multimedia', function(){
      var javascriptUrl = JSON.parse(val.validateMessage(JSON.stringify({ mensaje: 'javascript:alert(1)' })));
      var lookalikeVideo = JSON.parse(val.validateMessage(JSON.stringify({
        mensaje: 'https://youtube.com.evil.example/watch?v=qYwlqx-JLok'
      })));
      var credentialImage = JSON.parse(val.validateMessage(JSON.stringify({
        mensaje: 'https://trusted.example@evil.example/image.jpg'
      })));

      assert.equal(javascriptUrl.tipo, 'texto');
      assert.equal(lookalikeVideo.tipo, 'texto');
      assert.equal(credentialImage.tipo, 'texto');
      assert.equal(val.is_valid_yt_video('https://youtube.com.evil.example/watch?v=qYwlqx-JLok'), false);
      assert.equal(val.is_valid_url_image('javascript:alert(1).jpg'), false);
    });

  });

});








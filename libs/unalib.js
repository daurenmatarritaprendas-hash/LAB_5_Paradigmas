// modulo de ejemplo.

module.exports = {


    // logica que valida si un telefono esta correcto...
    is_valid_phone: function (phone) {
      // inicializacion lazy
      var isValid = false;
      // expresion regular copiada de StackOverflow
      var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;
  
      // validacion Regex
      try {
        isValid = re.test(phone);
      } catch (e) {
        console.log(e);
      } finally {
          return isValid;
      }
      // fin del try-catch block
    },
  
    is_valid_url_image: function (url) {
      try {
        var parsedUrl = new URL(url);
        var hasValidProtocol = ['http:', 'https:'].includes(parsedUrl.protocol);
        var hasNoCredentials = !parsedUrl.username && !parsedUrl.password;
        var imageExtension = /\.(?:jpg|gif|png|jpeg|bmp|webp)$/i;

        if (!hasValidProtocol || !parsedUrl.hostname || !hasNoCredentials) {
          return false;
        }

        if (imageExtension.test(parsedUrl.pathname)) {
          return true;
        }

        if (parsedUrl.hostname.toLowerCase() === 'th.bing.com') {
          var originalImageUrl = parsedUrl.searchParams.get('riu');
          if (!originalImageUrl) {
            return false;
          }

          var originalImage = new URL(originalImageUrl);
          return ['http:', 'https:'].includes(originalImage.protocol) &&
            Boolean(originalImage.hostname) &&
            !originalImage.username &&
            !originalImage.password &&
            imageExtension.test(originalImage.pathname);
        }

        return false;
      } catch (e) {
        return false;
      }
    },
  
    is_valid_yt_video: function (url) {
      return Boolean(this.getYTVideoId(url));
    },
  
    getYTVideoId: function(url){
      try {
        var parsedUrl = new URL(url);
        var host = parsedUrl.hostname.toLowerCase();
        var videoId = '';

        if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
          return null;
        }

        if (host === 'youtu.be') {
          videoId = parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
        } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
          videoId = parsedUrl.searchParams.get('v') ||
            parsedUrl.pathname.match(/^\/(?:embed|v|shorts)\/([^/]+)/)?.[1] || '';
        }

        return /^[\w-]{11}$/.test(videoId) ? videoId : null;
      } catch (e) {
        return null;
      }
    },
  
    validateMessage: function(msg){
      if (!msg || typeof msg !== 'string') {
        return JSON.stringify({ nombre: 'Anónimo', mensaje: '', color: '#222222', tipo: 'texto' });
      }

      try {
        var input = JSON.parse(msg);
        if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.mensaje !== 'string') {
          throw new TypeError('Invalid chat message');
        }

        var cleanText = function (value, maxLength) {
          return value
            .replace(/<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?(?:<\s*\/\s*\1\s*>|$)/gi, '')
            .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/[\u0000-\u001F\u007F]/g, '')
            .trim()
            .slice(0, maxLength);
        };
        var result = {
          nombre: cleanText(typeof input.nombre === 'string' ? input.nombre : 'Anónimo', 32) || 'Anónimo',
          mensaje: cleanText(input.mensaje, 2000),
          color: typeof input.color === 'string' && /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : '#222222',
          tipo: 'texto'
        };

        if (this.is_valid_url_image(result.mensaje)) {
          result.tipo = 'imagen';
        } else if (this.is_valid_yt_video(result.mensaje)) {
          result.tipo = 'video';
          result.videoId = this.getYTVideoId(result.mensaje);
        }

        return JSON.stringify(result);
      } catch (e) {
        return JSON.stringify({ nombre: 'Anónimo', mensaje: '', color: '#222222', tipo: 'texto' });
      }
    }
  
  
  
    
    
  
  // fin del modulo
  };
  
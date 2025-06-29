# CalFormat Deployment Guide

## .htaccess Configuration Guide

### Production Deployment

1. **Upload the main `.htaccess` file** to your web server's document root
2. **Ensure Apache modules are enabled** on your hosting provider:
   - `mod_rewrite` (for URL routing)
   - `mod_headers` (for security headers)
   - `mod_deflate` (for compression)
   - `mod_mime` (for MIME types)

### Development Setup

1. **For local development**, use `.htaccess.dev` instead:
   ```bash
   # Rename files for development
   mv .htaccess .htaccess.prod
   mv .htaccess.dev .htaccess
   ```

2. **For production deployment**:
   ```bash
   # Restore production file
   mv .htaccess .htaccess.dev
   mv .htaccess.prod .htaccess
   ```

## File Structure Requirements

Your production server should have this structure:
```
/public_html/ or /www/
├── .htaccess (production version)
├── index.html (React build)
├── static/ (React build assets)
├── public/
│   ├── ikas_products.php
│   ├── get_token.php
│   └── other assets
└── assets/ (if using Vite build)
```

## Security Configuration Details

### Content Security Policy (CSP)
The production `.htaccess` includes a comprehensive CSP that allows:
- **Scripts**: Self, inline, eval, Google Analytics, Firebase
- **Styles**: Self, inline, Google Fonts
- **Images**: Self, data URLs, all HTTPS sources
- **Connect**: Your APIs (Ikas, Firebase, GitHub, ImgBB)
- **Frames**: YouTube, Vimeo

### CORS Configuration
- **Development**: `*` (all origins)
- **Production**: Should be restricted to your domain
- **Methods**: GET, POST, OPTIONS, PUT, DELETE, PATCH
- **Headers**: Includes CSRF token support

## Troubleshooting Common Issues

### 1. React Router Not Working (404 on refresh)
**Symptom**: Direct URLs return 404
**Solution**: Ensure this rule is in place:
```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]
```

### 2. PHP API Not Accessible
**Symptom**: API endpoints return 404
**Solution**: Check API routing rules:
```apache
RewriteCond %{REQUEST_URI} ^/public/.*\.php$ [OR]
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ $1 [L]
```

### 3. CORS Issues
**Symptom**: Browser blocks API requests
**Solution**: 
- Check CORS headers in both `.htaccess` and PHP files
- Ensure OPTIONS requests are handled properly
- Verify domain whitelist in production

### 4. Images Not Loading
**Symptom**: Static images return 404
**Solution**:
- Verify image paths are correct
- Check static asset routing rules
- Ensure proper MIME types are set

### 5. CSP Violations
**Symptom**: Console shows CSP errors
**Solution**:
- Update CSP header to include required domains
- Check for inline scripts/styles
- Verify external resource domains

## Performance Optimizations

The production `.htaccess` includes:
- **Compression**: Gzip/Deflate for text files
- **Caching**: Long-term caching for static assets
- **Keep-Alive**: Connection persistence
- **ETag removal**: Better cache control

## Security Features

- **Directory Protection**: Prevents access to sensitive files
- **Server Signature**: Disabled for security
- **XSS Protection**: Browser-level protection enabled
- **Content Type**: Prevents MIME sniffing attacks
- **Frame Options**: Prevents clickjacking
- **Referrer Policy**: Controls referrer information

## Testing Your Configuration

### 1. Test React Routing
```bash
curl -I https://yourdomain.com/some-react-route
# Should return 200 and serve index.html
```

### 2. Test API Endpoints
```bash
curl -I https://yourdomain.com/public/ikas_products.php
# Should return 200 with proper CORS headers
```

### 3. Test Static Assets
```bash
curl -I https://yourdomain.com/static/css/main.css
# Should return 200 with cache headers
```

### 4. Test Security Headers
```bash
curl -I https://yourdomain.com/
# Check for CSP, X-Frame-Options, etc.
```

## Environment-Specific Notes

### Local Development (XAMPP/WAMP)
- Use `.htaccess.dev` for more permissive settings
- Enable `mod_rewrite` in Apache configuration
- Check `AllowOverride All` in virtual host config

### Shared Hosting
- Contact provider to enable required Apache modules
- Some hosts may restrict certain headers
- Test thoroughly after deployment

### VPS/Dedicated Server
- Full control over Apache configuration
- Can optimize at server level for better performance
- Consider using Apache virtual hosts for multiple domains

## Backup Strategy

Always keep backups of working configurations:
1. `.htaccess.prod` - Production version
2. `.htaccess.dev` - Development version  
3. `.htaccess.backup` - Last known working version

## Monitoring

After deployment, monitor:
- **Error logs**: Check for rewrite rule issues
- **Access logs**: Verify routing is working
- **Browser console**: Check for CSP violations
- **Network tab**: Verify CORS headers are present

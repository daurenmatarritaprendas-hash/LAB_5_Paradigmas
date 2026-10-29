const { test, expect } = require('@playwright/test');

const imageUrl = 'https://placehold.co/320x180.png';
const youtubeUrl = 'https://www.youtube.com/watch?v=M7lc1UVf-VE';
const youtubeEmbedUrl = 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE';

test.describe('Recorrido E2E de UNA Chat', () => {
  test('envía una URL de imagen y espera a que cargue', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill('E2E Imagen');
    await page.getByRole('textbox', { name: 'Escriba un mensaje' }).fill(imageUrl);
    await page.getByRole('button', { name: 'Send' }).click();

    const image = page.locator('#messages img').last();
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', imageUrl);
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0), {
      timeout: 20000
    }).toBe(true);
  });

  test('envía una URL de video y espera la navegación del reproductor', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill('E2E Video');
    await page.getByRole('textbox', { name: 'Escriba un mensaje' }).fill(youtubeUrl);
    await page.getByRole('button', { name: 'Send' }).click();

    const player = page.locator('#messages iframe').last();
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute('src', youtubeEmbedUrl);
    await expect.poll(() => page.frames().some((frame) => frame.url() === youtubeEmbedUrl), {
      timeout: 20000
    }).toBe(true);
  });

  test('bloquea la inyección de scripts sin mostrar un diálogo', async ({ page }) => {
    let unexpectedDialog;
    page.on('dialog', async (dialog) => {
      unexpectedDialog = dialog.message();
      await dialog.accept();
    });

    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill('E2E Seguridad');
    await page.getByRole('textbox', { name: 'Escriba un mensaje' })
      .fill("<script>alert('Inyección de script');</script>");
    await page.getByRole('button', { name: 'Send' }).click();

    const message = page.locator('#messages li').filter({ hasText: 'E2E Seguridad' }).last();
    await expect(message).toBeVisible();
    await expect(message).toHaveText('E2E Seguridad:');
    await expect(message.locator('script')).toHaveCount(0);
    expect(unexpectedDialog).toBeUndefined();

    await page.getByRole('textbox', { name: 'Escriba un mensaje' }).fill('La aplicación sigue funcionando');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('#messages li').filter({ hasText: 'La aplicación sigue funcionando' })).toBeVisible();
  });
});

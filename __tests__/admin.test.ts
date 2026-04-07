import { verifyAdmin, changeAdminPassword } from '../src/app/actions';

// Al iniciar db.ts se autogenera la clave default "admin2026"

describe('Autenticación y Seguridad Administrativa', () => {
  it('Verifica el acceso del administrador con la clave autogenerada por defecto', async () => {
    const isValid = await verifyAdmin('admin2026');
    expect(isValid).toBe(true);
  });

  it('Deniega el acceso con una clave incorrecta o débil', async () => {
    const isValid = await verifyAdmin('claveInvalida123');
    expect(isValid).toBe(false);
  });

  it('Comprueba el flujo para cambiar la clave maestra exitosamente', async () => {
    // 1. Cambiamos la clave original a una nueva
    const result = await changeAdminPassword('admin2026', 'AdminSuperSecure99!');
    expect(result.success).toBe(true);

    // 2. Comprobamos que la clave vieja YA NO funciona
    const isOldValid = await verifyAdmin('admin2026');
    expect(isOldValid).toBe(false);

    // 3. Comprobamos que la clave nueva SI funciona
    const isNewValid = await verifyAdmin('AdminSuperSecure99!');
    expect(isNewValid).toBe(true);

    // 4. Cleanup: Restauramos la clave por defecto para no afectar otros flujos por orden de ejecución
    await changeAdminPassword('AdminSuperSecure99!', 'admin2026');
  });

  it('Impide cambiar la clave si la clave original descrita no coincide', async () => {
    const result = await changeAdminPassword('WrongOldPassword', 'NewTestPassword');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    // Verificamos que la clave siga siendo la misma
    const checkOriginal = await verifyAdmin('admin2026');
    expect(checkOriginal).toBe(true);
  });
});

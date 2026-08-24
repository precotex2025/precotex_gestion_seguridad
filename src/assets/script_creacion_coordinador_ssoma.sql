-- =========================================================================================
-- PRECOTEX SOMA - SCRIPT SQL SERVER
-- CREACIÓN DE PUESTO: "Coordinador de SSOMA" Y USUARIO: "Cynthia Aldana"
-- Base de Datos: SQL Server
-- =========================================================================================

USE [BaseSeguridad_O_Produccion]; -- <-- Reemplaza con el nombre exacto de tu BD si aplica
GO

SET NOCOUNT ON;

PRINT '-----------------------------------------------------------------------------------';
PRINT 'INICIANDO REGISTRO DE: Coordinador de SSOMA - Cynthia Aldana';
PRINT '-----------------------------------------------------------------------------------';

-- =========================================================================================
-- 1. VERIFICAR O INSERTAR EN dbo.SN_Puesto
-- =========================================================================================
DECLARE @CodOrganizacion VARCHAR(10) = '001';
DECLARE @CodSede VARCHAR(10) = '001';
DECLARE @Puesto VARCHAR(250) = 'Coordinador de SSOMA';
DECLARE @Proceso VARCHAR(250) = 'SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente)';
DECLARE @UsuarioNombre VARCHAR(250) = 'Cynthia Aldana';
DECLARE @Nivel VARCHAR(50) = 'Mando Medio';
DECLARE @Permisos VARCHAR(250) = 'Lectura + descarga + modificar';
DECLARE @Estado VARCHAR(50) = 'Activo';
DECLARE @UsuarioRegistrador VARCHAR(50) = 'admin';

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[SN_Puesto] 
    WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(@Puesto)
)
BEGIN
    -- Obtener siguiente código correlativo de puesto
    DECLARE @MaxCod INT;
    SELECT @MaxCod = ISNULL(MAX(TRY_CAST(Codigo_Puesto AS INT)), 0) + 1 FROM [dbo].[SN_Puesto];
    DECLARE @NuevoCodPuesto VARCHAR(10) = RIGHT('000' + CAST(@MaxCod AS VARCHAR(10)), 3);

    INSERT INTO [dbo].[SN_Puesto] (
        [Codigo_Organizacion],
        [Codigo_Sede],
        [Codigo_Puesto],
        [Denominacion],
        [Codigo_Nivel_Riesgo],
        [Validacion_Periodica],
        [Puesto_Descripcion],
        [Puesto_Funciones],
        [Puesto_Requisitos],
        [Puesto_Caracteristicas],
        [Caracteristicas_Visible],
        [Flg_Activo],
        [Cod_Usuario]
    )
    VALUES (
        @CodOrganizacion,
        @CodSede,
        @NuevoCodPuesto,
        @Puesto,
        @Nivel,
        1,
        @Proceso,
        @UsuarioNombre,
        @Permisos,
        @Estado,
        1,
        '1',
        @UsuarioRegistrador
    );

    PRINT '✓ Puesto [Coordinador de SSOMA] registrado con código: ' + @NuevoCodPuesto;
END
ELSE
BEGIN
    -- Si ya existe, actualizamos los datos y asignamos a Cynthia Aldana
    UPDATE [dbo].[SN_Puesto]
    SET 
        [Puesto_Descripcion] = @Proceso,
        [Puesto_Funciones] = @UsuarioNombre,
        [Codigo_Nivel_Riesgo] = @Nivel,
        [Puesto_Requisitos] = @Permisos,
        [Puesto_Caracteristicas] = @Estado,
        [Flg_Activo] = '1'
    WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(@Puesto);

    PRINT '✓ Puesto [Coordinador de SSOMA] ya existía. Datos y usuario asignado actualizados.';
END
GO


-- =========================================================================================
-- 2. VERIFICAR O INSERTAR EN dbo.SN_Usuario (CREDENCIALES DE ACCESO)
-- =========================================================================================
DECLARE @CodUsuario VARCHAR(50) = 'caldana';
DECLARE @CodUsuarioAlt VARCHAR(50) = 'cynthia.aldana';
DECLARE @NombreCompleto VARCHAR(250) = 'Cynthia Aldana';
DECLARE @PasswordDefault VARCHAR(250) = 'Precotex2026!';
DECLARE @Email VARCHAR(150) = 'caldana@precotexperu.com';
DECLARE @PuestoCargo VARCHAR(250) = 'Coordinador de SSOMA';

-- Insertar usuario principal: caldana
IF NOT EXISTS (
    SELECT 1 FROM [dbo].[SN_Usuario] 
    WHERE LOWER(Cod_Usuario) = LOWER(@CodUsuario)
)
BEGIN
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario],
        [Password],
        [Nom_Usuario],
        [Cod_Rol],
        [Des_Rol],
        [Cod_Empresa],
        [Empresa],
        [Tip_Trabajador],
        [Cod_Trabajador],
        [Denominacion],
        [Email],
        [Flg_Activo]
    )
    VALUES (
        @CodUsuario,
        @PasswordDefault,
        @NombreCompleto,
        2,                     -- Rol 2: Usuario SOMA / Mando Medio
        'Usuario SOMA',
        '01',
        'Precotex S.A.C.',
        'SSOMA',
        'T084',
        @PuestoCargo,
        @Email,
        1
    );

    PRINT '✓ Usuario [caldana] creado exitosamente en dbo.SN_Usuario con clave: Precotex2026!';
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Usuario]
    SET 
        [Nom_Usuario] = @NombreCompleto,
        [Denominacion] = @PuestoCargo,
        [Email] = @Email,
        [Flg_Activo] = 1
    WHERE LOWER(Cod_Usuario) = LOWER(@CodUsuario);

    PRINT '✓ Usuario [caldana] actualizado correctamente.';
END

-- Insertar alias alternativo: cynthia.aldana
IF NOT EXISTS (
    SELECT 1 FROM [dbo].[SN_Usuario] 
    WHERE LOWER(Cod_Usuario) = LOWER(@CodUsuarioAlt)
)
BEGIN
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario],
        [Password],
        [Nom_Usuario],
        [Cod_Rol],
        [Des_Rol],
        [Cod_Empresa],
        [Empresa],
        [Tip_Trabajador],
        [Cod_Trabajador],
        [Denominacion],
        [Email],
        [Flg_Activo]
    )
    VALUES (
        @CodUsuarioAlt,
        @PasswordDefault,
        @NombreCompleto,
        2,
        'Usuario SOMA',
        '01',
        'Precotex S.A.C.',
        'SSOMA',
        'T084',
        @PuestoCargo,
        @Email,
        1
    );

    PRINT '✓ Usuario alias [cynthia.aldana] creado exitosamente.';
END
GO


-- =========================================================================================
-- 3. CONSULTA DE CONFIRMACIÓN Y VERIFICACIÓN
-- =========================================================================================
PRINT '-----------------------------------------------------------------------------------';
PRINT 'CONSULTA DE VERIFICACIÓN EN LA BASE DE DATOS:';
PRINT '-----------------------------------------------------------------------------------';

-- Ver el Puesto registrado
SELECT 
    Codigo_Puesto AS [Código],
    Denominacion AS [Puesto / Cargo],
    Puesto_Descripcion AS [Proceso],
    Puesto_Funciones AS [Usuario Asignado],
    Codigo_Nivel_Riesgo AS [Nivel],
    Puesto_Requisitos AS [Permisos],
    Puesto_Caracteristicas AS [Estado],
    Flg_Activo AS [Activo]
FROM [dbo].[SN_Puesto]
WHERE Denominacion LIKE '%SSOMA%' OR Puesto_Funciones LIKE '%Cynthia%';

-- Ver el Usuario y Credenciales registradas
SELECT 
    Cod_Usuario AS [Usuario Login],
    Nom_Usuario AS [Nombre y Apellidos],
    Password AS [Contraseña],
    Denominacion AS [Puesto Asignado],
    Email AS [Correo Corporativo],
    Des_Rol AS [Rol de Sistema],
    Flg_Activo AS [Estado Activo]
FROM [dbo].[SN_Usuario]
WHERE Cod_Usuario IN ('caldana', 'cynthia.aldana') OR Nom_Usuario LIKE '%Cynthia%';
GO

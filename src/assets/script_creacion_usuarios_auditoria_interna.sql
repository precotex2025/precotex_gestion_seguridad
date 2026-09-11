-- =========================================================================================
-- PRECOTEX SOMA - SCRIPT SQL SERVER
-- CREACIÓN DE PUESTOS Y USUARIOS DE AUDITORÍA INTERNA:
-- 1. Mia Zegarra   - Analista de Auditoría Interna
-- 2. Keith Vega    - Asistente de Auditoría Interna
-- Base de Datos: Microsoft SQL Server
-- =========================================================================================

-- USE [BaseSeguridad_O_Produccion]; -- <-- Reemplaza con el nombre exacto de tu BD si aplica
-- GO

SET NOCOUNT ON;

PRINT '-----------------------------------------------------------------------------------';
PRINT 'INICIANDO REGISTRO DE USUARIOS Y PUESTOS: AUDITORÍA INTERNA';
PRINT '-----------------------------------------------------------------------------------';

-- =========================================================================================
-- 1. ASEGURAR COLUMNAS EN dbo.SN_Usuario (Por si faltara alguna)
-- =========================================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND name = 'Email')
        ALTER TABLE [dbo].[SN_Usuario] ADD [Email] VARCHAR(150) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND name = 'Password')
        ALTER TABLE [dbo].[SN_Usuario] ADD [Password] VARCHAR(250) NULL DEFAULT 'Precotex2026!';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND name = 'Nom_Usuario')
        ALTER TABLE [dbo].[SN_Usuario] ADD [Nom_Usuario] VARCHAR(250) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND name = 'Cod_Rol')
        ALTER TABLE [dbo].[SN_Usuario] ADD [Cod_Rol] INT NULL DEFAULT 2;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND name = 'Des_Rol')
        ALTER TABLE [dbo].[SN_Usuario] ADD [Des_Rol] VARCHAR(50) NULL DEFAULT 'Usuario SOMA';

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Usuario]') AND name = 'Denominacion')
        ALTER TABLE [dbo].[SN_Usuario] ADD [Denominacion] VARCHAR(250) NULL;
END
GO


-- =========================================================================================
-- 2. VERIFICAR O INSERTAR PUESTOS EN dbo.SN_Puesto
-- =========================================================================================

-- A. PUESTO: Analista de Auditoría Interna (Mia Zegarra)
DECLARE @Puesto1 VARCHAR(250) = 'Analista de Auditoría Interna';
DECLARE @Usuario1 VARCHAR(250) = 'Mia Zegarra';
DECLARE @Proceso1 VARCHAR(250) = 'Auditoría Interna';
DECLARE @Permisos1 VARCHAR(250) = 'Lectura + descarga + modificar';

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[SN_Puesto] 
    WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(@Puesto1)
)
BEGIN
    DECLARE @MaxCod1 INT;
    SELECT @MaxCod1 = ISNULL(MAX(TRY_CAST(Codigo_Puesto AS INT)), 0) + 1 FROM [dbo].[SN_Puesto];
    DECLARE @NuevoCodPuesto1 VARCHAR(10) = RIGHT('000' + CAST(@MaxCod1 AS VARCHAR(10)), 3);

    INSERT INTO [dbo].[SN_Puesto] (
        [Codigo_Organizacion], [Codigo_Sede], [Codigo_Puesto], [Denominacion],
        [Codigo_Nivel_Riesgo], [Validacion_Periodica], [Puesto_Descripcion],
        [Puesto_Funciones], [Puesto_Requisitos], [Puesto_Caracteristicas],
        [Caracteristicas_Visible], [Flg_Activo], [Cod_Usuario]
    )
    VALUES (
        '001', '001', @NuevoCodPuesto1, @Puesto1,
        'Operativo', 1, @Proceso1,
        @Usuario1, @Permisos1, 'Activo',
        1, '1', 'admin'
    );
    PRINT '✓ Puesto registrado: ' + @Puesto1 + ' (Código: ' + @NuevoCodPuesto1 + ') asignado a: ' + @Usuario1;
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Puesto]
    SET 
        [Puesto_Descripcion] = @Proceso1,
        [Puesto_Funciones] = @Usuario1,
        [Codigo_Nivel_Riesgo] = 'Operativo',
        [Puesto_Requisitos] = @Permisos1,
        [Puesto_Caracteristicas] = 'Activo',
        [Flg_Activo] = '1'
    WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(@Puesto1);
    PRINT '✓ Puesto [' + @Puesto1 + '] actualizado con usuario asignado: ' + @Usuario1;
END
GO

-- B. PUESTO: Asistente de Auditoría Interna (Keith Vega)
DECLARE @Puesto2 VARCHAR(250) = 'Asistente de Auditoría Interna';
DECLARE @Usuario2 VARCHAR(250) = 'Keith Vega';
DECLARE @Proceso2 VARCHAR(250) = 'Auditoría Interna';
DECLARE @Permisos2 VARCHAR(250) = 'Lectura + descarga';

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[SN_Puesto] 
    WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(@Puesto2)
)
BEGIN
    DECLARE @MaxCod2 INT;
    SELECT @MaxCod2 = ISNULL(MAX(TRY_CAST(Codigo_Puesto AS INT)), 0) + 1 FROM [dbo].[SN_Puesto];
    DECLARE @NuevoCodPuesto2 VARCHAR(10) = RIGHT('000' + CAST(@MaxCod2 AS VARCHAR(10)), 3);

    INSERT INTO [dbo].[SN_Puesto] (
        [Codigo_Organizacion], [Codigo_Sede], [Codigo_Puesto], [Denominacion],
        [Codigo_Nivel_Riesgo], [Validacion_Periodica], [Puesto_Descripcion],
        [Puesto_Funciones], [Puesto_Requisitos], [Puesto_Caracteristicas],
        [Caracteristicas_Visible], [Flg_Activo], [Cod_Usuario]
    )
    VALUES (
        '001', '001', @NuevoCodPuesto2, @Puesto2,
        'Operativo', 1, @Proceso2,
        @Usuario2, @Permisos2, 'Activo',
        1, '1', 'admin'
    );
    PRINT '✓ Puesto registrado: ' + @Puesto2 + ' (Código: ' + @NuevoCodPuesto2 + ') asignado a: ' + @Usuario2;
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Puesto]
    SET 
        [Puesto_Descripcion] = @Proceso2,
        [Puesto_Funciones] = @Usuario2,
        [Codigo_Nivel_Riesgo] = 'Operativo',
        [Puesto_Requisitos] = @Permisos2,
        [Puesto_Caracteristicas] = 'Activo',
        [Flg_Activo] = '1'
    WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(@Puesto2);
    PRINT '✓ Puesto [' + @Puesto2 + '] actualizado con usuario asignado: ' + @Usuario2;
END
GO


-- =========================================================================================
-- 3. INSERTAR / ACTUALIZAR USUARIOS EN dbo.SN_Usuario
-- =========================================================================================

-- -----------------------------------------------------------------------------------------
-- 3.1 MIA ZEGARRA (mzegarra y mia.zegarra)
-- -----------------------------------------------------------------------------------------
DECLARE @Nom1 VARCHAR(250) = 'Mia Zegarra';
DECLARE @Email1 VARCHAR(150) = 'mzegarra@precotexperu.com';
DECLARE @Cargo1 VARCHAR(250) = 'Analista de Auditoría Interna';
DECLARE @PassDefault VARCHAR(250) = 'Precotex2026!';

-- Usuario Principal: mzegarra
IF NOT EXISTS (SELECT 1 FROM [dbo].[SN_Usuario] WHERE LOWER(Cod_Usuario) = 'mzegarra')
BEGIN
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario], [Password], [Nom_Usuario], [Cod_Rol], [Des_Rol],
        [Cod_Empresa], [Empresa], [Tip_Trabajador], [Cod_Trabajador],
        [Denominacion], [Email], [Flg_Activo]
    )
    VALUES (
        'mzegarra', @PassDefault, @Nom1, 2, 'Usuario SOMA',
        '01', 'Precotex S.A.C.', 'AUDITORIA', 'T085',
        @Cargo1, @Email1, 1
    );
    PRINT '✓ Usuario [mzegarra] creado exitosamente.';
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Usuario]
    SET [Nom_Usuario] = @Nom1, [Denominacion] = @Cargo1, [Email] = @Email1, [Flg_Activo] = 1
    WHERE LOWER(Cod_Usuario) = 'mzegarra';
    PRINT '✓ Usuario [mzegarra] actualizado.';
END

-- Alias alternativo: mia.zegarra
IF NOT EXISTS (SELECT 1 FROM [dbo].[SN_Usuario] WHERE LOWER(Cod_Usuario) = 'mia.zegarra')
BEGIN
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario], [Password], [Nom_Usuario], [Cod_Rol], [Des_Rol],
        [Cod_Empresa], [Empresa], [Tip_Trabajador], [Cod_Trabajador],
        [Denominacion], [Email], [Flg_Activo]
    )
    VALUES (
        'mia.zegarra', @PassDefault, @Nom1, 2, 'Usuario SOMA',
        '01', 'Precotex S.A.C.', 'AUDITORIA', 'T085',
        @Cargo1, @Email1, 1
    );
    PRINT '✓ Usuario [mia.zegarra] creado exitosamente.';
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Usuario]
    SET [Nom_Usuario] = @Nom1, [Denominacion] = @Cargo1, [Email] = @Email1, [Flg_Activo] = 1
    WHERE LOWER(Cod_Usuario) = 'mia.zegarra';
    PRINT '✓ Usuario [mia.zegarra] actualizado.';
END
GO

-- -----------------------------------------------------------------------------------------
-- 3.2 KEITH VEGA (kvega y keith.vega)
-- -----------------------------------------------------------------------------------------
DECLARE @Nom2 VARCHAR(250) = 'Keith Vega';
DECLARE @Email2 VARCHAR(150) = 'kvega@precotexperu.com';
DECLARE @Cargo2 VARCHAR(250) = 'Asistente de Auditoría Interna';
DECLARE @PassDefault VARCHAR(250) = 'Precotex2026!';

-- Usuario Principal: kvega
IF NOT EXISTS (SELECT 1 FROM [dbo].[SN_Usuario] WHERE LOWER(Cod_Usuario) = 'kvega')
BEGIN
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario], [Password], [Nom_Usuario], [Cod_Rol], [Des_Rol],
        [Cod_Empresa], [Empresa], [Tip_Trabajador], [Cod_Trabajador],
        [Denominacion], [Email], [Flg_Activo]
    )
    VALUES (
        'kvega', @PassDefault, @Nom2, 2, 'Usuario SOMA',
        '01', 'Precotex S.A.C.', 'AUDITORIA', 'T086',
        @Cargo2, @Email2, 1
    );
    PRINT '✓ Usuario [kvega] creado exitosamente.';
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Usuario]
    SET [Nom_Usuario] = @Nom2, [Denominacion] = @Cargo2, [Email] = @Email2, [Flg_Activo] = 1
    WHERE LOWER(Cod_Usuario) = 'kvega';
    PRINT '✓ Usuario [kvega] actualizado.';
END

-- Alias alternativo: keith.vega
IF NOT EXISTS (SELECT 1 FROM [dbo].[SN_Usuario] WHERE LOWER(Cod_Usuario) = 'keith.vega')
BEGIN
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario], [Password], [Nom_Usuario], [Cod_Rol], [Des_Rol],
        [Cod_Empresa], [Empresa], [Tip_Trabajador], [Cod_Trabajador],
        [Denominacion], [Email], [Flg_Activo]
    )
    VALUES (
        'keith.vega', @PassDefault, @Nom2, 2, 'Usuario SOMA',
        '01', 'Precotex S.A.C.', 'AUDITORIA', 'T086',
        @Cargo2, @Email2, 1
    );
    PRINT '✓ Usuario [keith.vega] creado exitosamente.';
END
ELSE
BEGIN
    UPDATE [dbo].[SN_Usuario]
    SET [Nom_Usuario] = @Nom2, [Denominacion] = @Cargo2, [Email] = @Email2, [Flg_Activo] = 1
    WHERE LOWER(Cod_Usuario) = 'keith.vega';
    PRINT '✓ Usuario [keith.vega] actualizado.';
END
GO


-- =========================================================================================
-- 4. CONSULTAS DE VERIFICACIÓN
-- =========================================================================================
PRINT '-----------------------------------------------------------------------------------';
PRINT 'CONSULTA DE VERIFICACIÓN EN LA BASE DE DATOS:';
PRINT '-----------------------------------------------------------------------------------';

-- Ver Puestos registrados
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
WHERE Puesto_Funciones IN ('Mia Zegarra', 'Keith Vega') 
   OR Denominacion LIKE '%Auditoría Interna%';

-- Ver Usuarios registrados
SELECT 
    Cod_Usuario AS [Usuario Login],
    Nom_Usuario AS [Nombre y Apellidos],
    Password AS [Contraseña],
    Denominacion AS [Puesto Asignado],
    Email AS [Correo Corporativo],
    Des_Rol AS [Rol de Sistema],
    Flg_Activo AS [Estado Activo]
FROM [dbo].[SN_Usuario]
WHERE Cod_Usuario IN ('mzegarra', 'mia.zegarra', 'kvega', 'keith.vega');
GO

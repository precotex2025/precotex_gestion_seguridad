-- =========================================================================================
-- PRECOTEX SOMA - SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS SQL SERVER
-- Compatible con todas las versiones de SQL Server (2008 / 2012 / 2014 / 2016 / 2019 / 2022)
-- =========================================================================================

-- 1. ASEGURAR COLUMNAS EN TABLA SN_MANUAL
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SN_MANUAL]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_MANUAL]') AND name = 'Tipo_Documento')
        ALTER TABLE [dbo].[SN_MANUAL] ADD [Tipo_Documento] VARCHAR(100) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_MANUAL]') AND name = 'Fecha_Vigencia')
        ALTER TABLE [dbo].[SN_MANUAL] ADD [Fecha_Vigencia] VARCHAR(20) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_MANUAL]') AND name = 'Usuario_Registro')
        ALTER TABLE [dbo].[SN_MANUAL] ADD [Usuario_Registro] VARCHAR(100) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_MANUAL]') AND name = 'Fec_Registro')
        ALTER TABLE [dbo].[SN_MANUAL] ADD [Fec_Registro] DATETIME NULL DEFAULT GETDATE();

    PRINT 'Tabla SN_MANUAL verificada y actualizada.';
END
ELSE
BEGIN
    CREATE TABLE [dbo].[SN_MANUAL] (
        [Id_Manual]         INT IDENTITY(1,1) PRIMARY KEY,
        [Codigo]            VARCHAR(20) NULL,
        [Titulo]            VARCHAR(250) NOT NULL,
        [Subtitulo]         VARCHAR(250) NULL,
        [Tipo_Documento]    VARCHAR(100) NULL,
        [Fecha_Vigencia]    VARCHAR(20) NULL,
        [Descripcion]       VARCHAR(MAX) NULL,
        [Autor]             VARCHAR(100) NULL,
        [Fecha_Publicacion] VARCHAR(50) NULL,
        [Version]           VARCHAR(20) NULL DEFAULT 'v1.0',
        [Color]             VARCHAR(30) NULL DEFAULT '#7c6cf0',
        [Icono]             VARCHAR(50) NULL DEFAULT 'picture_as_pdf',
        [Archivo]           VARCHAR(250) NULL,
        [Descargas]         INT NULL DEFAULT 0,
        [Usuario_Registro]  VARCHAR(100) NULL,
        [Flg_Activo]        BIT NULL DEFAULT 1,
        [Fec_Registro]      DATETIME NULL DEFAULT GETDATE()
    );
    PRINT 'Tabla SN_MANUAL creada exitosamente.';
END
GO

-- 2. ASEGURAR COLUMNA EN TABLA SN_PORTAFOLIO_MEJORA
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SN_PORTAFOLIO_MEJORA]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_PORTAFOLIO_MEJORA]') AND name = 'Fecha_Fin')
        ALTER TABLE [dbo].[SN_PORTAFOLIO_MEJORA] ADD [Fecha_Fin] DATE NULL;

    PRINT 'Campo Fecha_Fin verificado en SN_PORTAFOLIO_MEJORA.';
END
GO

-- 3. PROCEDIMIENTO ALMACENADO: SP_SN_MANUAL_MNTO
IF OBJECT_ID(N'[dbo].[SP_SN_MANUAL_MNTO]', N'P') IS NULL
    EXEC('CREATE PROCEDURE [dbo].[SP_SN_MANUAL_MNTO] AS SELECT 1;');
GO

ALTER PROCEDURE [dbo].[SP_SN_MANUAL_MNTO]
    @Accion             VARCHAR(5) = NULL,
    @Id_Manual          INT = NULL,
    @Codigo             VARCHAR(20) = NULL,
    @Titulo             VARCHAR(250) = NULL,
    @Subtitulo          VARCHAR(250) = NULL,
    @Tipo_Documento     VARCHAR(100) = NULL,
    @Fecha_Vigencia     VARCHAR(20) = NULL,
    @Descripcion        VARCHAR(MAX) = NULL,
    @Autor              VARCHAR(100) = NULL,
    @Fecha_Publicacion  VARCHAR(50) = NULL,
    @Version            VARCHAR(20) = 'v1.0',
    @Color              VARCHAR(30) = '#7c6cf0',
    @Icono              VARCHAR(50) = 'picture_as_pdf',
    @Archivo            VARCHAR(250) = NULL,
    @Usuario_Registro   VARCHAR(100) = 'SISTEMAS'
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'I'
    BEGIN
        INSERT INTO [dbo].[SN_MANUAL] (
            [Codigo], [Titulo], [Subtitulo], [Tipo_Documento], [Fecha_Vigencia],
            [Descripcion], [Autor], [Fecha_Publicacion], [Version], [Color],
            [Icono], [Archivo], [Descargas], [Usuario_Registro], [Flg_Activo]
        )
        VALUES (
            @Codigo, @Titulo, @Subtitulo, @Tipo_Documento, @Fecha_Vigencia,
            @Descripcion, @Autor, @Fecha_Publicacion, @Version, @Color,
            @Icono, @Archivo, 0, @Usuario_Registro, 1
        );

        SELECT @@IDENTITY AS Id_Manual, 1 AS Success, 'Manual registrado correctamente.' AS Message;
    END
    ELSE IF @Accion = 'U'
    BEGIN
        UPDATE [dbo].[SN_MANUAL]
        SET [Titulo]            = ISNULL(@Titulo, [Titulo]),
            [Subtitulo]         = ISNULL(@Subtitulo, [Subtitulo]),
            [Tipo_Documento]    = ISNULL(@Tipo_Documento, [Tipo_Documento]),
            [Fecha_Vigencia]    = ISNULL(@Fecha_Vigencia, [Fecha_Vigencia]),
            [Descripcion]       = ISNULL(@Descripcion, [Descripcion]),
            [Autor]             = ISNULL(@Autor, [Autor]),
            [Fecha_Publicacion] = ISNULL(@Fecha_Publicacion, [Fecha_Publicacion]),
            [Archivo]           = ISNULL(@Archivo, [Archivo]),
            [Usuario_Registro]  = ISNULL(@Usuario_Registro, [Usuario_Registro])
        WHERE [Id_Manual] = @Id_Manual;

        SELECT @Id_Manual AS Id_Manual, 1 AS Success, 'Manual actualizado correctamente.' AS Message;
    END
    ELSE IF @Accion = 'D'
    BEGIN
        UPDATE [dbo].[SN_MANUAL]
        SET [Flg_Activo] = 0
        WHERE [Id_Manual] = @Id_Manual;

        SELECT @Id_Manual AS Id_Manual, 1 AS Success, 'Manual eliminado correctamente.' AS Message;
    END
    ELSE IF @Accion = 'INC'
    BEGIN
        UPDATE [dbo].[SN_MANUAL]
        SET [Descargas] = ISNULL([Descargas], 0) + 1
        WHERE [Id_Manual] = @Id_Manual;

        SELECT @Id_Manual AS Id_Manual, 1 AS Success, 'Contador de descargas incrementado.' AS Message;
    END
END
GO

-- ===================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS: MÓDULO DE OBJETIVOS SIG
-- Base de Datos: BDSecureNorm
-- Tablas: [dbo].[SN_Objetivo], [dbo].[SN_Objetivo_Medicion]
-- Procedimientos: [dbo].[SP_SN_OBJETIVOS_LISTAR], [dbo].[SP_SN_OBJETIVOS_MNTO],
--                 [dbo].[SP_SN_OBJETIVO_MEDICIONES_LISTAR], [dbo].[SP_SN_OBJETIVO_MEDICIONES_MNTO]
-- Requerimientos: OBJ-01 (Nuevos campos) y OBJ-02 (Retiro Observaciones)
-- ===================================================================

USE BDSecureNorm;
GO

-- ===================================================================
-- 1. TABLA: [dbo].[SN_Objetivo]
-- ===================================================================
IF OBJECT_ID(N'[dbo].[SN_Objetivo]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SN_Objetivo] (
        [Id_Objetivo] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Codigo] VARCHAR(50) NOT NULL,
        [Nombre] VARCHAR(300) NOT NULL,
        [Proceso] VARCHAR(150) NULL,
        [Norma] VARCHAR(100) NULL,
        [Periodo] VARCHAR(50) NULL,                       -- OBJ-01
        [Responsable_Proceso] VARCHAR(150) NULL,          -- OBJ-01
        [Fecha_Inicio] DATE NULL,                         -- OBJ-01
        [Fecha_Fin] DATE NULL,                            -- OBJ-01
        [Responsable_Seguimiento] VARCHAR(150) NULL,      -- OBJ-01
        [Medio_Verificacion] VARCHAR(300) NULL,           -- OBJ-01
        [Indicador] VARCHAR(250) NULL,
        [Formula_Calculo] VARCHAR(300) NULL,              -- OBJ-01
        [Unidad_Medida] VARCHAR(50) NULL DEFAULT ('%'),   -- OBJ-01
        [Base] VARCHAR(50) NULL,
        [Meta] DECIMAL(10,2) NULL,
        [Avance] DECIMAL(5,2) NULL DEFAULT (0),           -- OBJ-01
        [Frecuencia] VARCHAR(50) NULL DEFAULT ('Mensual'),
        [Estado] VARCHAR(50) NULL DEFAULT ('Planificado'),
        [Descripcion] VARCHAR(500) NULL,
        [Flg_Activo] BIT NOT NULL DEFAULT (1),
        [Fecha_Registro] DATETIME NOT NULL DEFAULT (GETDATE()),
        [Fec_Registro] DATETIME NOT NULL DEFAULT (GETDATE()),
        [Usuario_Registro] VARCHAR(100) NULL DEFAULT ('SISTEMAS')
    );
    PRINT '--> Tabla [dbo].[SN_Objetivo] creada con éxito.';
END
ELSE
BEGIN
    -- Columnas Base y Maestras
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Proceso')
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Proceso] VARCHAR(150) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Norma')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Norma] VARCHAR(100) NULL;
        PRINT '    + Agregada columna: Norma';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Indicador')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Indicador] VARCHAR(250) NULL;
        PRINT '    + Agregada columna: Indicador';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Base')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Base] VARCHAR(50) NULL;
        PRINT '    + Agregada columna: Base';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Meta')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Meta] DECIMAL(10,2) NULL;
        PRINT '    + Agregada columna: Meta';
    END

    -- OBJ-01: Período
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Periodo')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Periodo] VARCHAR(50) NULL;
        PRINT '    + Agregada columna: Periodo';
    END

    -- OBJ-01: Responsable del Proceso
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Responsable_Proceso')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Responsable_Proceso] VARCHAR(150) NULL;
        PRINT '    + Agregada columna: Responsable_Proceso';
    END

    -- OBJ-01: Fecha de Inicio
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Fecha_Inicio')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Fecha_Inicio] DATE NULL;
        PRINT '    + Agregada columna: Fecha_Inicio';
    END

    -- OBJ-01: Fecha de Fin
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Fecha_Fin')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Fecha_Fin] DATE NULL;
        PRINT '    + Agregada columna: Fecha_Fin';
    END

    -- OBJ-01: Responsable de Seguimiento
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Responsable_Seguimiento')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Responsable_Seguimiento] VARCHAR(150) NULL;
        PRINT '    + Agregada columna: Responsable_Seguimiento';
    END

    -- OBJ-01: Medio de Verificación
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Medio_Verificacion')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Medio_Verificacion] VARCHAR(300) NULL;
        PRINT '    + Agregada columna: Medio_Verificacion';
    END

    -- OBJ-01: Fórmula de Cálculo
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Formula_Calculo')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Formula_Calculo] VARCHAR(300) NULL;
        PRINT '    + Agregada columna: Formula_Calculo';
    END

    -- OBJ-01: Unidad de Medida
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Unidad_Medida')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Unidad_Medida] VARCHAR(50) NULL DEFAULT ('%');
        PRINT '    + Agregada columna: Unidad_Medida';
    END

    -- OBJ-01: Avance (%)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Avance')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Avance] DECIMAL(5,2) NULL DEFAULT (0);
        PRINT '    + Agregada columna: Avance';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Frecuencia')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Frecuencia] VARCHAR(50) NULL DEFAULT ('Mensual');
        PRINT '    + Agregada columna: Frecuencia';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Estado')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Estado] VARCHAR(50) NULL DEFAULT ('Planificado');
        PRINT '    + Agregada columna: Estado';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Descripcion')
    BEGIN
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Descripcion] VARCHAR(500) NULL;
        PRINT '    + Agregada columna: Descripcion';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Flg_Activo')
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Flg_Activo] BIT NOT NULL DEFAULT (1);

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Fecha_Registro')
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Fecha_Registro] DATETIME NOT NULL DEFAULT (GETDATE());

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Objetivo]') AND name = 'Fec_Registro')
        ALTER TABLE [dbo].[SN_Objetivo] ADD [Fec_Registro] DATETIME NOT NULL DEFAULT (GETDATE());

    PRINT '--> Todas las columnas de [dbo].[SN_Objetivo] verificadas y actualizadas correctamente.';
END
GO

-- ===================================================================
-- 2. TABLA: [dbo].[SN_Objetivo_Medicion]
-- ===================================================================
IF OBJECT_ID(N'[dbo].[SN_Objetivo_Medicion]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SN_Objetivo_Medicion] (
        [Id_Medicion] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Id_Objetivo] INT NULL,
        [Codigo_Objetivo] VARCHAR(50) NULL,
        [Periodo] VARCHAR(50) NULL,
        [Valor_Obtenido] DECIMAL(10,2) NULL,
        [Avance] DECIMAL(5,2) NULL DEFAULT (0),
        [Semaforo] VARCHAR(50) NULL DEFAULT ('En meta'),
        [Evidencia] VARCHAR(250) NULL,
        [Archivo_Evidencia] VARCHAR(250) NULL,
        [Comentario] VARCHAR(500) NULL,
        [Flg_Activo] BIT NOT NULL DEFAULT (1),
        [Fecha_Registro] DATETIME NOT NULL DEFAULT (GETDATE()),
        [Fec_Registro] DATETIME NOT NULL DEFAULT (GETDATE()),
        [Usuario_Registro] VARCHAR(100) NULL DEFAULT ('SISTEMAS')
    );
    PRINT '--> Tabla [dbo].[SN_Objetivo_Medicion] creada con éxito.';
END
GO

-- ===================================================================
-- 3. PROCEDIMIENTO ALMACENADO: [dbo].[SP_SN_OBJETIVOS_LISTAR]
-- ===================================================================
CREATE OR ALTER PROCEDURE [dbo].[SP_SN_OBJETIVOS_LISTAR]
    @sFiltro VARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        O.Id_Objetivo,
        O.Codigo,
        O.Nombre,
        ISNULL(O.Proceso, 'SSOMA') AS Proceso,
        ISNULL(O.Norma, 'ISO 9001:2015') AS Norma,
        ISNULL(O.Periodo, '2026') AS Periodo,
        ISNULL(O.Responsable_Proceso, 'Jefe de Proceso') AS Responsable_Proceso,
        O.Fecha_Inicio,
        O.Fecha_Fin,
        ISNULL(O.Responsable_Seguimiento, 'Coordinador SIG') AS Responsable_Seguimiento,
        ISNULL(O.Medio_Verificacion, 'Reportes de Gestión') AS Medio_Verificacion,
        ISNULL(O.Indicador, '% Cumplimiento') AS Indicador,
        ISNULL(O.Formula_Calculo, '(Real / Plan) * 100') AS Formula_Calculo,
        ISNULL(O.Unidad_Medida, '%') AS Unidad_Medida,
        ISNULL(O.Base, '0%') AS Base,
        ISNULL(O.Meta, 100.00) AS Meta,
        ISNULL(O.Avance, 0.00) AS PorcentajeAvance,
        ISNULL(O.Frecuencia, 'Mensual') AS Frecuencia,
        ISNULL(O.Estado, 'Planificado') AS Estado,
        ISNULL(O.Descripcion, '') AS Descripcion,
        O.Fecha_Registro,
        O.Usuario_Registro
    FROM dbo.SN_Objetivo O
    WHERE ISNULL(O.Flg_Activo, 1) = 1
      AND (
          @sFiltro = '' 
          OR O.Codigo LIKE '%' + @sFiltro + '%'
          OR O.Nombre LIKE '%' + @sFiltro + '%'
          OR ISNULL(O.Proceso, '') LIKE '%' + @sFiltro + '%'
          OR ISNULL(O.Norma, '') LIKE '%' + @sFiltro + '%'
          OR ISNULL(O.Periodo, '') LIKE '%' + @sFiltro + '%'
          OR ISNULL(O.Responsable_Proceso, '') LIKE '%' + @sFiltro + '%'
      )
    ORDER BY O.Id_Objetivo DESC;
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_OBJETIVOS_LISTAR] creado / actualizado.';
GO

-- ===================================================================
-- 4. PROCEDIMIENTO ALMACENADO: [dbo].[SP_SN_OBJETIVOS_MNTO]
-- ===================================================================
CREATE OR ALTER PROCEDURE [dbo].[SP_SN_OBJETIVOS_MNTO]
    @Accion VARCHAR(1), -- 'I': Insert, 'U': Update, 'D': Delete
    @Id_Objetivo INT = 0,
    @Codigo VARCHAR(50) = '',
    @Nombre VARCHAR(300) = '',
    @Proceso VARCHAR(150) = '',
    @Norma VARCHAR(100) = '',
    @Periodo VARCHAR(50) = '',
    @Responsable_Proceso VARCHAR(150) = '',
    @Fecha_Inicio DATE = NULL,
    @Fecha_Fin DATE = NULL,
    @Responsable_Seguimiento VARCHAR(150) = '',
    @Medio_Verificacion VARCHAR(300) = '',
    @Indicador VARCHAR(250) = '',
    @Formula_Calculo VARCHAR(300) = '',
    @Unidad_Medida VARCHAR(50) = '%',
    @Base VARCHAR(50) = '',
    @Meta DECIMAL(10,2) = 100,
    @Avance DECIMAL(5,2) = 0,
    @Frecuencia VARCHAR(50) = 'Mensual',
    @Estado VARCHAR(50) = 'Planificado',
    @Descripcion VARCHAR(500) = '',
    @Usuario_Registro VARCHAR(100) = 'SISTEMAS'
AS
BEGIN
    SET NOCOUNT ON;

    -- Generación automática de código si no fue especificado
    IF (ISNULL(@Codigo, '') = '')
    BEGIN
        DECLARE @NextNum INT;
        SELECT @NextNum = ISNULL(MAX(Id_Objetivo), 0) + 1 FROM dbo.SN_Objetivo;
        SET @Codigo = 'OBJ-' + CAST(YEAR(GETDATE()) AS VARCHAR) + '-' + RIGHT('000' + CAST(@NextNum AS VARCHAR), 3);
    END

    IF @Accion = 'I'
    BEGIN
        INSERT INTO dbo.SN_Objetivo (
            Codigo, Nombre, Proceso, Norma, Periodo, Responsable_Proceso,
            Fecha_Inicio, Fecha_Fin, Responsable_Seguimiento, Medio_Verificacion,
            Indicador, Formula_Calculo, Unidad_Medida, Base, Meta, Avance,
            Frecuencia, Estado, Descripcion, Flg_Activo, Fecha_Registro, Fec_Registro, Usuario_Registro
        ) VALUES (
            @Codigo, @Nombre, @Proceso, @Norma, @Periodo, @Responsable_Proceso,
            @Fecha_Inicio, @Fecha_Fin, @Responsable_Seguimiento, @Medio_Verificacion,
            @Indicador, @Formula_Calculo, @Unidad_Medida, @Base, @Meta, @Avance,
            @Frecuencia, @Estado, @Descripcion, 1, GETDATE(), GETDATE(), @Usuario_Registro
        );
        SELECT SCOPE_IDENTITY() AS Id_Objetivo, 'Objetivo registrado con éxito' AS Mensaje;
    END
    ELSE IF @Accion = 'U'
    BEGIN
        UPDATE dbo.SN_Objetivo
        SET Nombre = @Nombre,
            Proceso = @Proceso,
            Norma = @Norma,
            Periodo = @Periodo,
            Responsable_Proceso = @Responsable_Proceso,
            Fecha_Inicio = @Fecha_Inicio,
            Fecha_Fin = @Fecha_Fin,
            Responsable_Seguimiento = @Responsable_Seguimiento,
            Medio_Verificacion = @Medio_Verificacion,
            Indicador = @Indicador,
            Formula_Calculo = @Formula_Calculo,
            Unidad_Medida = @Unidad_Medida,
            Base = @Base,
            Meta = @Meta,
            Avance = @Avance,
            Frecuencia = @Frecuencia,
            Estado = @Estado,
            Descripcion = @Descripcion
        WHERE Codigo = @Codigo OR Id_Objetivo = @Id_Objetivo;
        SELECT @Id_Objetivo AS Id_Objetivo, 'Objetivo actualizado con éxito' AS Mensaje;
    END
    ELSE IF @Accion = 'D'
    BEGIN
        UPDATE dbo.SN_Objetivo 
        SET Flg_Activo = 0 
        WHERE Codigo = @Codigo OR Id_Objetivo = @Id_Objetivo;
        SELECT @Id_Objetivo AS Id_Objetivo, 'Objetivo eliminado con éxito' AS Mensaje;
    END
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_OBJETIVOS_MNTO] creado / actualizado.';
GO

-- ===================================================================
-- 5. PROCEDIMIENTO ALMACENADO: [dbo].[SP_SN_OBJETIVO_MEDICIONES_LISTAR]
-- ===================================================================
CREATE OR ALTER PROCEDURE [dbo].[SP_SN_OBJETIVO_MEDICIONES_LISTAR]
    @idObjetivo INT = NULL,
    @sFiltro VARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        M.Id_Medicion,
        M.Id_Objetivo,
        ISNULL(M.Codigo_Objetivo, O.Codigo) AS Codigo_Objetivo,
        ISNULL(O.Nombre, 'Objetivo de Gestión') AS Nombre_Objetivo,
        ISNULL(O.Proceso, 'SSOMA') AS Proceso,
        ISNULL(M.Periodo, '2026-Q1') AS Periodo,
        M.Valor_Obtenido,
        ISNULL(M.Avance, 0) AS Avance,
        ISNULL(M.Semaforo, 'En meta') AS Semaforo,
        ISNULL(M.Evidencia, ISNULL(M.Archivo_Evidencia, '')) AS Evidencia,
        M.Comentario,
        M.Fecha_Registro
    FROM dbo.SN_Objetivo_Medicion M
    LEFT JOIN dbo.SN_Objetivo O ON M.Id_Objetivo = O.Id_Objetivo OR M.Codigo_Objetivo = O.Codigo
    WHERE ISNULL(M.Flg_Activo, 1) = 1
      AND (@idObjetivo IS NULL OR M.Id_Objetivo = @idObjetivo)
    ORDER BY M.Id_Medicion DESC;
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_OBJETIVO_MEDICIONES_LISTAR] creado / actualizado.';
GO

-- ===================================================================
-- 6. PROCEDIMIENTO ALMACENADO: [dbo].[SP_SN_OBJETIVO_MEDICIONES_MNTO]
-- ===================================================================
CREATE OR ALTER PROCEDURE [dbo].[SP_SN_OBJETIVO_MEDICIONES_MNTO]
    @Accion VARCHAR(1),
    @Id_Medicion INT = 0,
    @Id_Objetivo INT = NULL,
    @Codigo_Objetivo VARCHAR(50) = '',
    @Periodo VARCHAR(50) = '',
    @Valor_Obtenido DECIMAL(10,2) = 0,
    @Avance DECIMAL(5,2) = 0,
    @Semaforo VARCHAR(50) = 'En meta',
    @Evidencia VARCHAR(250) = '',
    @Comentario VARCHAR(500) = '',
    @Usuario_Registro VARCHAR(100) = 'SISTEMAS'
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'I'
    BEGIN
        INSERT INTO dbo.SN_Objetivo_Medicion (
            Id_Objetivo, Codigo_Objetivo, Periodo, Valor_Obtenido, Avance,
            Semaforo, Evidencia, Archivo_Evidencia, Comentario,
            Flg_Activo, Fecha_Registro, Fec_Registro, Usuario_Registro
        ) VALUES (
            @Id_Objetivo, @Codigo_Objetivo, @Periodo, @Valor_Obtenido, @Avance,
            @Semaforo, @Evidencia, @Evidencia, @Comentario,
            1, GETDATE(), GETDATE(), @Usuario_Registro
        );
        SELECT SCOPE_IDENTITY() AS Id_Medicion, 'Medición de objetivo registrada' AS Mensaje;
    END
    ELSE IF @Accion = 'U'
    BEGIN
        UPDATE dbo.SN_Objetivo_Medicion
        SET Periodo = @Periodo,
            Valor_Obtenido = @Valor_Obtenido,
            Avance = @Avance,
            Semaforo = @Semaforo,
            Evidencia = CASE WHEN ISNULL(@Evidencia, '') <> '' THEN @Evidencia ELSE Evidencia END,
            Comentario = @Comentario
        WHERE Id_Medicion = @Id_Medicion;
        SELECT @Id_Medicion AS Id_Medicion, 'Medición de objetivo actualizada' AS Mensaje;
    END
    ELSE IF @Accion = 'D'
    BEGIN
        UPDATE dbo.SN_Objetivo_Medicion SET Flg_Activo = 0 WHERE Id_Medicion = @Id_Medicion;
        SELECT @Id_Medicion AS Id_Medicion, 'Medición eliminada' AS Mensaje;
    END
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_OBJETIVO_MEDICIONES_MNTO] creado / actualizado.';
GO

PRINT '===================================================================';
PRINT '   SCRIPT DE OBJETIVOS SIG EJECUTADO CON ÉXITO EN BDSecureNorm';
PRINT '===================================================================';
GO

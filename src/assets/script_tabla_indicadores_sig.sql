-- ===================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS: MÓDULO DE INDICADORES SIG
-- SISTEMA INTEGRADO DE GESTIÓN PRECOTEX (SIG)
-- FIX: Agregar Fecha_Inicio y Fecha_Fin en dbo.SN_Indicador
-- ===================================================================

USE [BDSecureNorm]
GO

-- ===================================================================
-- 1. ACTUALIZAR TABLA: dbo.SN_Indicador
-- ===================================================================
IF OBJECT_ID(N'[dbo].[SN_Indicador]', N'U') IS NOT NULL
BEGIN
    PRINT '--> Actualizando columnas en [dbo].[SN_Indicador]...';

    -- Columnas de Fechas de Inicio y Fin
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Fecha_Inicio')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Fecha_Inicio] DATE NULL;
        PRINT '    + Agregada columna: Fecha_Inicio';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Fecha_Fin')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Fecha_Fin] DATE NULL;
        PRINT '    + Agregada columna: Fecha_Fin';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Fec_Inicio')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Fec_Inicio] DATE NULL;
        PRINT '    + Agregada columna: Fec_Inicio';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Fec_Fin')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Fec_Fin] DATE NULL;
        PRINT '    + Agregada columna: Fec_Fin';
    END

    -- Columna Fecha_Registro
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Fecha_Registro')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Fecha_Registro] DATETIME NULL CONSTRAINT DF_SN_Indicador_Fecha_Registro DEFAULT (GETDATE());
        PRINT '    + Agregada columna: Fecha_Registro';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Fec_Registro')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Fec_Registro] DATETIME NULL CONSTRAINT DF_SN_Indicador_Fec_Registro DEFAULT (GETDATE());
        PRINT '    + Agregada columna: Fec_Registro';
    END

    -- Columnas de IND-02
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Tipo')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Tipo] VARCHAR(50) NULL;
        PRINT '    + Agregada columna: Tipo';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Sede')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Sede] VARCHAR(100) NULL;
        PRINT '    + Agregada columna: Sede';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Norma')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Norma] VARCHAR(100) NULL;
        PRINT '    + Agregada columna: Norma';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Frecuencia')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Frecuencia] VARCHAR(50) NULL;
        PRINT '    + Agregada columna: Frecuencia';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Meta')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Meta] DECIMAL(10,2) NULL;
        PRINT '    + Agregada columna: Meta';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador]') AND name = 'Unidad_Medida')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador] ADD [Unidad_Medida] VARCHAR(50) NULL;
        PRINT '    + Agregada columna: Unidad_Medida';
    END

    -- Poblar Fecha_Registro en filas existentes si estuviera nula
    EXEC('UPDATE [dbo].[SN_Indicador] SET Fecha_Registro = ISNULL(Fecha_Registro, GETDATE()) WHERE Fecha_Registro IS NULL;');
    
    PRINT '--> [dbo].[SN_Indicador] actualizada correctamente.';
END
GO

-- ===================================================================
-- 2. ACTUALIZAR TABLA: dbo.SN_Indicador_Medicion
-- ===================================================================
IF OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]', N'U') IS NOT NULL
BEGIN
    PRINT '--> Actualizando columnas en [dbo].[SN_Indicador_Medicion]...';

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Fecha_Registro')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Fecha_Registro] DATETIME NULL CONSTRAINT DF_SN_Medicion_Fecha_Registro DEFAULT (GETDATE());
        PRINT '    + Agregada columna: Fecha_Registro';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Fec_Registro')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Fec_Registro] DATETIME NULL CONSTRAINT DF_SN_Medicion_Fec_Registro DEFAULT (GETDATE());
        PRINT '    + Agregada columna: Fec_Registro';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Tipo')
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Tipo] VARCHAR(50) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Sede')
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Sede] VARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Proceso')
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Proceso] VARCHAR(150) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Norma')
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Norma] VARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Frecuencia')
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Frecuencia] VARCHAR(50) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Meta')
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Meta] DECIMAL(10,2) NULL;

    -- Garantizar que Codigo_Indicador no arroje error si fuera NULL
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Codigo_Indicador')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ALTER COLUMN [Codigo_Indicador] VARCHAR(50) NULL;
        PRINT '    + Columna Codigo_Indicador modificada a NULLable.';
    END

    -- Columna Evidencia (IND-08)
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Evidencia')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Evidencia] VARCHAR(250) NULL;
        PRINT '    + Agregada columna: Evidencia';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[SN_Indicador_Medicion]') AND name = 'Archivo_Evidencia')
    BEGIN
        ALTER TABLE [dbo].[SN_Indicador_Medicion] ADD [Archivo_Evidencia] VARCHAR(250) NULL;
        PRINT '    + Agregada columna: Archivo_Evidencia';
    END

    EXEC('UPDATE [dbo].[SN_Indicador_Medicion] SET Fecha_Registro = ISNULL(Fecha_Registro, GETDATE()) WHERE Fecha_Registro IS NULL;');
    
    -- Actualizar registros existentes que tengan NULL en Codigo_Indicador y campos relacionados
    EXEC('
        UPDATE M
        SET 
            M.Codigo_Indicador = ISNULL(NULLIF(M.Codigo_Indicador, ''''), ISNULL(I.Codigo, ''IND-2026-001'')),
            M.Nombre_Indicador = ISNULL(NULLIF(M.Nombre_Indicador, ''''), ISNULL(I.Nombre, ''Indicador de Gestión'')),
            M.Tipo = ISNULL(NULLIF(M.Tipo, ''''), ISNULL(I.Tipo, ''Eficacia'')),
            M.Sede = ISNULL(NULLIF(M.Sede, ''''), ISNULL(I.Sede, ''Todas'')),
            M.Proceso = ISNULL(NULLIF(M.Proceso, ''''), ISNULL(I.Nombre_Proceso, ISNULL(I.Codigo_Proceso, ''SSOMA''))),
            M.Norma = ISNULL(NULLIF(M.Norma, ''''), ISNULL(I.Norma, ''ISO 9001:2015'')),
            M.Frecuencia = ISNULL(NULLIF(M.Frecuencia, ''''), ISNULL(I.Frecuencia, ''Mensual'')),
            M.Meta = ISNULL(M.Meta, ISNULL(I.Meta, 85.00)),
            M.Semaforo = ISNULL(NULLIF(M.Semaforo, ''''), CASE WHEN M.Valor_Obtenido >= ISNULL(M.Meta, ISNULL(I.Meta, 85)) THEN ''En meta'' ELSE ''En riesgo'' END)
        FROM dbo.SN_Indicador_Medicion M
        LEFT JOIN dbo.SN_Indicador I ON M.Id_Indicador = I.Id_Indicador OR M.Codigo_Indicador = I.Codigo;
    ');

    PRINT '--> [dbo].[SN_Indicador_Medicion] actualizada y datos nulos corregidos correctamente.';
END
GO

-- ===================================================================
-- 3. PROCEDIMIENTO ALMACENADO: SP_SN_INDICADORES_LISTAR
-- ===================================================================
IF OBJECT_ID('[dbo].[SP_SN_INDICADORES_LISTAR]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[SP_SN_INDICADORES_LISTAR];
GO

CREATE PROCEDURE [dbo].[SP_SN_INDICADORES_LISTAR]
    @sFiltro VARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Indicador,
        Codigo,
        Nombre,
        ISNULL(Tipo, 'Eficiencia') AS Tipo,
        ISNULL(Sede, 'Sede Huachipa') AS Sede,
        ISNULL(Norma, 'ISO 9001:2015') AS Norma,
        ISNULL(Frecuencia, 'Mensual') AS Frecuencia,
        ISNULL(Meta, 0) AS Meta,
        ISNULL(Unidad_Medida, '%') AS Unidad_Medida,
        Tipo_Meta,
        Sentido,
        Linea_Base,
        Formula,
        Codigo_Proceso,
        Nombre_Proceso,
        Responsable,
        Resp_Medicion,
        Fuente_Datos,
        CONVERT(VARCHAR(10), ISNULL(Fecha_Inicio, Fec_Inicio), 120) AS Fecha_Inicio,
        CONVERT(VARCHAR(10), ISNULL(Fecha_Fin, Fec_Fin), 120) AS Fecha_Fin,
        CONVERT(VARCHAR(10), ISNULL(Fecha_Inicio, Fec_Inicio), 120) AS Fec_Inicio,
        CONVERT(VARCHAR(10), ISNULL(Fecha_Fin, Fec_Fin), 120) AS Fec_Fin,
        Areas_Acceso,
        ISNULL(Estado, 'Activo') AS Estado,
        ISNULL(Fecha_Registro, ISNULL(Fec_Registro, GETDATE())) AS Fecha_Registro,
        ISNULL(Fec_Registro, ISNULL(Fecha_Registro, GETDATE())) AS Fec_Registro
    FROM dbo.SN_Indicador
    WHERE ISNULL(Flg_Activo, 1) = 1
      AND (@sFiltro = '' OR Codigo LIKE '%' + @sFiltro + '%' OR Nombre LIKE '%' + @sFiltro + '%' OR ISNULL(Nombre_Proceso, '') LIKE '%' + @sFiltro + '%')
    ORDER BY Id_Indicador DESC;
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_INDICADORES_LISTAR] actualizado con éxito.';
GO

-- ===================================================================
-- 4. PROCEDIMIENTO ALMACENADO: SP_SN_INDICADORES_MNTO
-- ===================================================================
IF OBJECT_ID('[dbo].[SP_SN_INDICADORES_MNTO]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[SP_SN_INDICADORES_MNTO];
GO

CREATE PROCEDURE [dbo].[SP_SN_INDICADORES_MNTO]
    @Accion VARCHAR(1), -- 'I': Insert, 'U': Update, 'D': Delete
    @Id_Indicador INT = 0,
    @Codigo VARCHAR(50) = '',
    @Nombre VARCHAR(250) = '',
    @Tipo VARCHAR(50) = 'Eficiencia',
    @Sede VARCHAR(100) = 'Todas',
    @Norma VARCHAR(100) = 'ISO 9001:2015',
    @Frecuencia VARCHAR(50) = 'Mensual',
    @Meta DECIMAL(10,2) = 0,
    @Unidad_Medida VARCHAR(50) = '%',
    @Tipo_Meta VARCHAR(50) = '',
    @Sentido VARCHAR(50) = '',
    @Linea_Base VARCHAR(50) = '',
    @Formula VARCHAR(250) = '',
    @Codigo_Proceso VARCHAR(50) = '',
    @Nombre_Proceso VARCHAR(150) = '',
    @Responsable VARCHAR(250) = '',
    @Resp_Medicion VARCHAR(250) = '',
    @Fuente_Datos VARCHAR(250) = '',
    @Fec_Inicio DATE = NULL,
    @Fec_Fin DATE = NULL,
    @Fecha_Inicio DATE = NULL,
    @Fecha_Fin DATE = NULL,
    @Areas_Acceso VARCHAR(500) = '',
    @Estado VARCHAR(50) = 'Activo',
    @Usuario_Registro VARCHAR(100) = 'SISTEMAS'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_Fec_Ini DATE = ISNULL(@Fecha_Inicio, @Fec_Inicio);
    DECLARE @v_Fec_Fin DATE = ISNULL(@Fecha_Fin, @Fec_Fin);

    IF @Accion = 'I'
    BEGIN
        -- IND-03: Codificación automática de indicador si viene vacío o autogenerado
        IF ISNULL(@Codigo, '') = '' OR @Codigo = 'AUTOGENERADO'
        BEGIN
            DECLARE @NextId INT = (SELECT ISNULL(MAX(Id_Indicador), 0) + 1 FROM dbo.SN_Indicador);
            SET @Codigo = 'IND-' + CAST(YEAR(GETDATE()) AS VARCHAR(4)) + '-' + RIGHT('000' + CAST(@NextId AS VARCHAR(10)), 3);
        END

        INSERT INTO dbo.SN_Indicador (
            Codigo, Nombre, Tipo, Sede, Norma, Frecuencia, Meta, Unidad_Medida,
            Tipo_Meta, Sentido, Linea_Base, Formula, Codigo_Proceso, Nombre_Proceso,
            Responsable, Resp_Medicion, Fuente_Datos, Fecha_Inicio, Fecha_Fin, Fec_Inicio, Fec_Fin,
            Areas_Acceso, Estado, Fecha_Registro, Fec_Registro, Usuario_Registro, Flg_Activo
        ) VALUES (
            @Codigo, @Nombre, @Tipo, @Sede, @Norma, @Frecuencia, @Meta, @Unidad_Medida,
            @Tipo_Meta, @Sentido, @Linea_Base, @Formula, @Codigo_Proceso, @Nombre_Proceso,
            @Responsable, @Resp_Medicion, @Fuente_Datos, @v_Fec_Ini, @v_Fec_Fin, @v_Fec_Ini, @v_Fec_Fin,
            @Areas_Acceso, @Estado, GETDATE(), GETDATE(), @Usuario_Registro, 1
        );
        SELECT SCOPE_IDENTITY() AS Id_Indicador, 'Indicador registrado con éxito' AS Mensaje;
    END
    ELSE IF @Accion = 'U'
    BEGIN
        UPDATE dbo.SN_Indicador
        SET Codigo = @Codigo,
            Nombre = @Nombre,
            Tipo = @Tipo,
            Sede = @Sede,
            Norma = @Norma,
            Frecuencia = @Frecuencia,
            Meta = @Meta,
            Unidad_Medida = @Unidad_Medida,
            Tipo_Meta = @Tipo_Meta,
            Sentido = @Sentido,
            Linea_Base = @Linea_Base,
            Formula = @Formula,
            Codigo_Proceso = @Codigo_Proceso,
            Nombre_Proceso = @Nombre_Proceso,
            Responsable = @Responsable,
            Resp_Medicion = @Resp_Medicion,
            Fuente_Datos = @Fuente_Datos,
            Fecha_Inicio = @v_Fec_Ini,
            Fecha_Fin = @v_Fec_Fin,
            Fec_Inicio = @v_Fec_Ini,
            Fec_Fin = @v_Fec_Fin,
            Areas_Acceso = @Areas_Acceso,
            Estado = @Estado
        WHERE Id_Indicador = @Id_Indicador;
        SELECT @Id_Indicador AS Id_Indicador, 'Indicador actualizado con éxito' AS Mensaje;
    END
    ELSE IF @Accion = 'D'
    BEGIN
        UPDATE dbo.SN_Indicador SET Flg_Activo = 0 WHERE Id_Indicador = @Id_Indicador;
        SELECT @Id_Indicador AS Id_Indicador, 'Indicador eliminado con éxito' AS Mensaje;
    END
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_INDICADORES_MNTO] actualizado con éxito.';
GO

-- ===================================================================
-- 5. PROCEDIMIENTO ALMACENADO: SP_SN_INDICADOR_MEDICIONES_LISTAR
-- ===================================================================
IF OBJECT_ID('[dbo].[SP_SN_INDICADOR_MEDICIONES_LISTAR]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[SP_SN_INDICADOR_MEDICIONES_LISTAR];
GO

CREATE PROCEDURE [dbo].[SP_SN_INDICADOR_MEDICIONES_LISTAR]
    @idIndicador INT = NULL,
    @sFiltro VARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        M.Id_Medicion,
        ISNULL(M.Id_Indicador, I.Id_Indicador) AS Id_Indicador,
        ISNULL(NULLIF(M.Codigo_Indicador, ''), ISNULL(I.Codigo, 'IND-2026-001')) AS Codigo_Indicador,
        ISNULL(NULLIF(M.Nombre_Indicador, ''), ISNULL(I.Nombre, 'Indicador de Producción')) AS Nombre_Indicador,
        ISNULL(NULLIF(M.Tipo, ''), ISNULL(I.Tipo, 'Eficacia')) AS Tipo,
        ISNULL(NULLIF(M.Sede, ''), ISNULL(I.Sede, 'Todas')) AS Sede,
        ISNULL(NULLIF(M.Proceso, ''), ISNULL(I.Nombre_Proceso, ISNULL(I.Codigo_Proceso, 'SSOMA'))) AS Nombre_Proceso,
        ISNULL(NULLIF(M.Norma, ''), ISNULL(I.Norma, 'ISO 9001:2015')) AS Norma,
        ISNULL(NULLIF(M.Frecuencia, ''), ISNULL(I.Frecuencia, 'Mensual')) AS Frecuencia,
        ISNULL(M.Meta, ISNULL(I.Meta, 85.00)) AS Meta,
        M.Valor_Obtenido,
        ISNULL(I.Unidad_Medida, '%') AS Unidad_Medida,
        ISNULL(NULLIF(M.Periodo, ''), 'Junio 2025') AS Periodo,
        ISNULL(NULLIF(M.Semaforo, ''), CASE WHEN M.Valor_Obtenido >= ISNULL(M.Meta, ISNULL(I.Meta, 85)) THEN 'En meta' ELSE 'En riesgo' END) AS Semaforo,
        M.Comentario,
        ISNULL(M.Evidencia, ISNULL(M.Archivo_Evidencia, '')) AS Evidencia,
        ISNULL(M.Fecha_Registro, ISNULL(M.Fec_Registro, GETDATE())) AS Fecha_Registro,
        ISNULL(M.Fec_Registro, ISNULL(M.Fecha_Registro, GETDATE())) AS Fec_Registro
    FROM dbo.SN_Indicador_Medicion M
    LEFT JOIN dbo.SN_Indicador I ON M.Id_Indicador = I.Id_Indicador OR M.Codigo_Indicador = I.Codigo
    WHERE ISNULL(M.Flg_Activo, 1) = 1
      AND (@idIndicador IS NULL OR M.Id_Indicador = @idIndicador)
      AND (@sFiltro = '' OR M.Codigo_Indicador LIKE '%' + @sFiltro + '%' OR M.Nombre_Indicador LIKE '%' + @sFiltro + '%' OR ISNULL(I.Nombre, '') LIKE '%' + @sFiltro + '%')
    ORDER BY M.Id_Medicion DESC;
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_INDICADOR_MEDICIONES_LISTAR] actualizado con éxito.';
GO

-- ===================================================================
-- 6. PROCEDIMIENTO ALMACENADO: SP_SN_INDICADOR_MEDICIONES_MNTO
-- ===================================================================
IF OBJECT_ID('[dbo].[SP_SN_INDICADOR_MEDICIONES_MNTO]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[SP_SN_INDICADOR_MEDICIONES_MNTO];
GO

CREATE PROCEDURE [dbo].[SP_SN_INDICADOR_MEDICIONES_MNTO]
    @Accion VARCHAR(1), -- 'I': Insert, 'U': Update, 'D': Delete
    @Id_Medicion INT = 0,
    @Id_Indicador INT = NULL,
    @Codigo_Indicador VARCHAR(50) = '',
    @Nombre_Indicador VARCHAR(250) = '',
    @Tipo VARCHAR(50) = '',
    @Sede VARCHAR(100) = '',
    @Proceso VARCHAR(150) = '',
    @Norma VARCHAR(100) = '',
    @Frecuencia VARCHAR(50) = '',
    @Meta DECIMAL(10,2) = 0,
    @Periodo VARCHAR(50) = '',
    @Valor_Obtenido DECIMAL(10,2) = 0,
    @Semaforo VARCHAR(50) = 'En meta',
    @Evidencia VARCHAR(250) = '',
    @Comentario VARCHAR(500) = '',
    @Usuario_Registro VARCHAR(100) = 'SISTEMAS'
AS
BEGIN
    SET NOCOUNT ON;

    -- Resolución de seguridad para Codigo_Indicador si llegara NULL o vacío
    IF (ISNULL(@Codigo_Indicador, '') = '' AND @Id_Indicador IS NOT NULL AND @Id_Indicador > 0)
    BEGIN
        SELECT TOP 1 
            @Codigo_Indicador = ISNULL(Codigo, 'IND-' + CAST(YEAR(GETDATE()) AS VARCHAR) + '-001'),
            @Nombre_Indicador = CASE WHEN ISNULL(@Nombre_Indicador, '') = '' THEN Nombre ELSE @Nombre_Indicador END,
            @Tipo = CASE WHEN ISNULL(@Tipo, '') = '' THEN Tipo ELSE @Tipo END,
            @Sede = CASE WHEN ISNULL(@Sede, '') = '' THEN Sede ELSE @Sede END,
            @Norma = CASE WHEN ISNULL(@Norma, '') = '' THEN Norma ELSE @Norma END,
            @Frecuencia = CASE WHEN ISNULL(@Frecuencia, '') = '' THEN Frecuencia ELSE @Frecuencia END
        FROM dbo.SN_Indicador 
        WHERE Id_Indicador = @Id_Indicador;
    END

    IF (ISNULL(@Codigo_Indicador, '') = '')
    BEGIN
        SET @Codigo_Indicador = 'IND-' + CAST(YEAR(GETDATE()) AS VARCHAR) + '-001';
    END

    IF (ISNULL(@Nombre_Indicador, '') = '')
    BEGIN
        SET @Nombre_Indicador = 'Indicador ' + @Codigo_Indicador;
    END

    IF @Accion = 'I'
    BEGIN
        INSERT INTO dbo.SN_Indicador_Medicion (
            Id_Indicador, Codigo_Indicador, Nombre_Indicador, Tipo, Sede, Proceso,
            Norma, Frecuencia, Meta, Periodo, Valor_Obtenido, Semaforo, Evidencia, Archivo_Evidencia, Comentario,
            Fecha_Registro, Fec_Registro, Usuario_Registro, Flg_Activo
        ) VALUES (
            @Id_Indicador, @Codigo_Indicador, @Nombre_Indicador, @Tipo, @Sede, @Proceso,
            @Norma, @Frecuencia, @Meta, @Periodo, @Valor_Obtenido, @Semaforo, @Evidencia, @Evidencia, @Comentario,
            GETDATE(), GETDATE(), @Usuario_Registro, 1
        );
        SELECT SCOPE_IDENTITY() AS Id_Medicion, 'Medición registrada con éxito' AS Mensaje;
    END
    ELSE IF @Accion = 'U'
    BEGIN
        UPDATE dbo.SN_Indicador_Medicion
        SET Id_Indicador = @Id_Indicador,
            Codigo_Indicador = @Codigo_Indicador,
            Nombre_Indicador = @Nombre_Indicador,
            Tipo = @Tipo,
            Sede = @Sede,
            Proceso = @Proceso,
            Norma = @Norma,
            Frecuencia = @Frecuencia,
            Meta = @Meta,
            Periodo = @Periodo,
            Valor_Obtenido = @Valor_Obtenido,
            Semaforo = @Semaforo,
            Evidencia = CASE WHEN ISNULL(@Evidencia, '') <> '' THEN @Evidencia ELSE Evidencia END,
            Archivo_Evidencia = CASE WHEN ISNULL(@Evidencia, '') <> '' THEN @Evidencia ELSE Archivo_Evidencia END,
            Comentario = @Comentario
        WHERE Id_Medicion = @Id_Medicion;
        SELECT @Id_Medicion AS Id_Medicion, 'Medición actualizada con éxito' AS Mensaje;
    END
    ELSE IF @Accion = 'D'
    BEGIN
        UPDATE dbo.SN_Indicador_Medicion SET Flg_Activo = 0 WHERE Id_Medicion = @Id_Medicion;
        SELECT @Id_Medicion AS Id_Medicion, 'Medición eliminada con éxito' AS Mensaje;
    END
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_INDICADOR_MEDICIONES_MNTO] actualizado con éxito.';
GO

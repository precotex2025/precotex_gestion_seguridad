-- ====================================================================================
-- SCRIPT DE BASE DE DATOS SQL SERVER: MÓDULO DE GESTIÓN LEGAL Y REQUISITOS NORMATIVOS
-- Empresa: PRECOTEX S.A.C.
-- Sistema: Sistema Integrado de Gestión de Seguridad (SIG PRECOTEX)
-- Compatibilidad: Compatible con SQL Server 2008 R2, 2012, 2014, 2016, 2017, 2019, 2022+
-- ====================================================================================

USE [BDSecureNorm];
GO

-- ------------------------------------------------------------------------------------
-- 1. CREACIÓN DE LA TABLA [dbo].[SN_REQUISITO_LEGAL]
-- ------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SN_REQUISITO_LEGAL]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SN_REQUISITO_LEGAL](
        [nid_req_legal]          INT IDENTITY(1,1) NOT NULL,
        [citem]                  VARCHAR(20) NULL,           -- Ítem (N°, ej. 1.1, 2.1)
        [vrequisito]             VARCHAR(500) NOT NULL,      -- Requisito / Título del Documento Legal
        [vtema]                  VARCHAR(150) NULL,          -- Carpetas por Área (ej. Formación y capacitaciones, Comité de SST)
        [vambito]                 VARCHAR(150) NULL,          -- Ámbito de Aplicación (ej. Seguridad y Salud en el Trabajo, Medio Ambiente)
        [vtipo]                  VARCHAR(100) NULL,          -- Tipo de Norma (Ley, Decreto Supremo, Programa, Licencia)
        [vnorma]                 VARCHAR(250) NULL,          -- Código y Título de la Normativa (ej. Ley 29783)
        [varticulo]              VARCHAR(100) NULL,          -- N° de Artículo (ej. Art. 22)
        [ventidad]               VARCHAR(150) NULL,          -- Organismo Emisor / Entidad (ej. MINTRA, SUNAFIL, MINAM)
        [vextracto_obligacion]   VARCHAR(MAX) NULL,          -- Extracto del Artículo / Obligación que exige
        [vevidencia_cumplimiento] VARCHAR(250) NULL,          -- Documento o Evidencia de Cumplimiento
        [vestado]                VARCHAR(50) NOT NULL,       -- Evaluación de Cumplimiento ('Cumple', 'En proceso', 'No cumple')
        [vresponsable]           VARCHAR(150) NULL,          -- Área o Responsable asignado
        [vfrecuencia]            VARCHAR(50) NULL,           -- Frecuencia / Vigencia ('Anual', 'Mensual', 'Única vez')
        [devaluacion]            DATE NULL,                  -- Fecha de Última Evaluación / Emisión
        [dproxeval]              DATE NULL,                  -- Fecha de Próxima Evaluación
        [dvencimiento]           DATE NULL,                  -- Fecha de Vencimiento
        [vobservaciones]         VARCHAR(MAX) NULL,          -- Observaciones adicionales
        [vevidencia_archivo]     VARCHAR(250) NULL,          -- Nombre de archivo adjunto de evidencia
        [cflg_estado]            CHAR(1) NOT NULL CONSTRAINT [DF_SN_REQ_LEGAL_cflg_estado] DEFAULT ('A'), -- 'A': Activo, 'I': Inactivo
        [dfec_creacion]          DATETIME NOT NULL CONSTRAINT [DF_SN_REQ_LEGAL_dfec_creacion] DEFAULT (GETDATE()),
        [cusu_creacion]          VARCHAR(50) NULL,
        [dfec_modificacion]      DATETIME NULL,
        [cusu_modificacion]      VARCHAR(50) NULL,
        CONSTRAINT [PK_SN_REQUISITO_LEGAL] PRIMARY KEY CLUSTERED ([nid_req_legal] ASC)
    );

    PRINT '--> Tabla [dbo].[SN_REQUISITO_LEGAL] creada con éxito.';
END
ELSE
BEGIN
    PRINT '--> La tabla [dbo].[SN_REQUISITO_LEGAL] ya existe.';
END
GO


-- ------------------------------------------------------------------------------------
-- 2. PROCEDIMIENTO ALMACENADO: [dbo].[SP_SN_REQ_LEGAL_LISTAR]
-- ------------------------------------------------------------------------------------
IF OBJECT_ID('dbo.SP_SN_REQ_LEGAL_LISTAR', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_SN_REQ_LEGAL_LISTAR;
GO

CREATE PROCEDURE dbo.SP_SN_REQ_LEGAL_LISTAR
    @sFiltro VARCHAR(150) = ''
AS
BEGIN
    SET NOCOUNT ON;

    SET @sFiltro = LTRIM(RTRIM(ISNULL(@sFiltro, '')));

    SELECT 
        r.[nid_req_legal]          AS id,
        ISNULL(r.[citem], '')      AS item,
        r.[vrequisito]             AS requisito,
        ISNULL(r.[vtema], '')      AS tema,
        ISNULL(r.[vambito], '')    AS ambito,
        ISNULL(r.[vtipo], '')      AS tipo,
        ISNULL(r.[vnorma], '')     AS norma,
        ISNULL(r.[varticulo], '')  AS articulo,
        ISNULL(r.[ventidad], '')   AS entidad,
        ISNULL(r.[vextracto_obligacion], '')   AS obligacion,
        ISNULL(r.[vevidencia_cumplimiento], '') AS evidenciadoc,
        r.[vestado]                AS estado,
        ISNULL(r.[vresponsable], '') AS responsable,
        ISNULL(r.[vfrecuencia], '')  AS frecuencia,
        CONVERT(VARCHAR(10), r.[devaluacion], 120)  AS evaluacion,
        CONVERT(VARCHAR(10), r.[dproxeval], 120)    AS proxeval,
        CONVERT(VARCHAR(10), r.[dvencimiento], 120)  AS vencimiento,
        ISNULL(r.[vobservaciones], '') AS observaciones,
        ISNULL(r.[vevidencia_archivo], '') AS evidencia,
        r.[cflg_estado]            AS flg_estado,
        r.[dfec_creacion]          AS fec_creacion
    FROM [dbo].[SN_REQUISITO_LEGAL] r WITH (NOLOCK)
    WHERE r.[cflg_estado] = 'A'
      AND (@sFiltro = '' OR 
           r.[vrequisito] LIKE '%' + @sFiltro + '%' OR
           r.[vnorma] LIKE '%' + @sFiltro + '%' OR
           r.[vtema] LIKE '%' + @sFiltro + '%' OR
           r.[vambito] LIKE '%' + @sFiltro + '%' OR
           r.[ventidad] LIKE '%' + @sFiltro + '%' OR
           r.[vresponsable] LIKE '%' + @sFiltro + '%')
    ORDER BY r.[nid_req_legal] DESC;
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_REQ_LEGAL_LISTAR] creado con éxito.';
GO


-- ------------------------------------------------------------------------------------
-- 3. PROCEDIMIENTO ALMACENADO: [dbo].[SP_SN_REQ_LEGAL_MNTO] (INSERTAR / EDITAR / ELIMINAR)
-- ------------------------------------------------------------------------------------
IF OBJECT_ID('dbo.SP_SN_REQ_LEGAL_MNTO', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_SN_REQ_LEGAL_MNTO;
GO

CREATE PROCEDURE dbo.SP_SN_REQ_LEGAL_MNTO
    @cAccion                 CHAR(1),                    -- 'I': Insertar, 'U': Actualizar, 'D': Eliminar
    @nid_req_legal           INT = 0 OUTPUT,
    @citem                   VARCHAR(20) = NULL,
    @vrequisito              VARCHAR(500) = NULL,
    @vtema                   VARCHAR(150) = NULL,
    @vambito                  VARCHAR(150) = NULL,
    @vtipo                   VARCHAR(100) = NULL,
    @vnorma                  VARCHAR(250) = NULL,
    @varticulo               VARCHAR(100) = NULL,
    @ventidad                VARCHAR(150) = NULL,
    @vextracto_obligacion    VARCHAR(MAX) = NULL,
    @vevidencia_cumplimiento VARCHAR(250) = NULL,
    @vestado                 VARCHAR(50) = 'En proceso',
    @vresponsable            VARCHAR(150) = NULL,
    @vfrecuencia             VARCHAR(50) = NULL,
    @devaluacion             DATE = NULL,
    @dproxeval               DATE = NULL,
    @dvencimiento            DATE = NULL,
    @vobservaciones          VARCHAR(MAX) = NULL,
    @vevidencia_archivo      VARCHAR(250) = NULL,
    @cusu_usuario            VARCHAR(50) = 'SISTEMAS'
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- --------------------------------------------------
        -- ACCIÓN 'I': INSERTAR NUEVO REQUISITO LEGAL
        -- --------------------------------------------------
        IF @cAccion = 'I'
        BEGIN
            INSERT INTO [dbo].[SN_REQUISITO_LEGAL] (
                [citem],
                [vrequisito],
                [vtema],
                [vambito],
                [vtipo],
                [vnorma],
                [varticulo],
                [ventidad],
                [vextracto_obligacion],
                [vevidencia_cumplimiento],
                [vestado],
                [vresponsable],
                [vfrecuencia],
                [devaluacion],
                [dproxeval],
                [dvencimiento],
                [vobservaciones],
                [vevidencia_archivo],
                [cflg_estado],
                [dfec_creacion],
                [cusu_creacion]
            )
            VALUES (
                @citem,
                ISNULL(@vrequisito, @vnorma),
                ISNULL(@vtema, @vambito),
                ISNULL(@vambito, 'Seguridad y Salud en el Trabajo'),
                @vtipo,
                @vnorma,
                @varticulo,
                ISNULL(@ventidad, 'MINTRA'),
                @vextracto_obligacion,
                @vevidencia_cumplimiento,
                ISNULL(@vestado, 'En proceso'),
                @vresponsable,
                @vfrecuencia,
                @devaluacion,
                @dproxeval,
                @dvencimiento,
                @vobservaciones,
                @vevidencia_archivo,
                'A',
                GETDATE(),
                @cusu_usuario
            );

            SET @nid_req_legal = SCOPE_IDENTITY();
            
            SELECT 1 AS bExito, 'Requisito legal registrado con éxito.' AS vMensaje, @nid_req_legal AS id;
        END

        -- --------------------------------------------------
        -- ACCIÓN 'U': ACTUALIZAR REQUISITO LEGAL EXISTENTE
        -- --------------------------------------------------
        ELSE IF @cAccion = 'U'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM [dbo].[SN_REQUISITO_LEGAL] WHERE [nid_req_legal] = @nid_req_legal AND [cflg_estado] = 'A')
            BEGIN
                RAISERROR('El requisito legal especificado no existe o se encuentra inactivo.', 16, 1);
            END

            UPDATE [dbo].[SN_REQUISITO_LEGAL]
            SET 
                [citem]                  = ISNULL(@citem, [citem]),
                [vrequisito]             = ISNULL(@vrequisito, [vrequisito]),
                [vtema]                  = ISNULL(@vtema, [vtema]),
                [vambito]                 = ISNULL(@vambito, [vambito]),
                [vtipo]                  = ISNULL(@vtipo, [vtipo]),
                [vnorma]                 = ISNULL(@vnorma, [vnorma]),
                [varticulo]              = ISNULL(@varticulo, [varticulo]),
                [ventidad]               = ISNULL(@ventidad, [ventidad]),
                [vextracto_obligacion]   = ISNULL(@vextracto_obligacion, [vextracto_obligacion]),
                [vevidencia_cumplimiento] = ISNULL(@vevidencia_cumplimiento, [vevidencia_cumplimiento]),
                [vestado]                = ISNULL(@vestado, [vestado]),
                [vresponsable]           = ISNULL(@vresponsable, [vresponsable]),
                [vfrecuencia]            = ISNULL(@vfrecuencia, [vfrecuencia]),
                [devaluacion]            = @devaluacion,
                [dproxeval]              = @dproxeval,
                [dvencimiento]           = @dvencimiento,
                [vobservaciones]         = ISNULL(@vobservaciones, [vobservaciones]),
                [vevidencia_archivo]     = ISNULL(@vevidencia_archivo, [vevidencia_archivo]),
                [dfec_modificacion]      = GETDATE(),
                [cusu_modificacion]      = @cusu_usuario
            WHERE [nid_req_legal] = @nid_req_legal;

            SELECT 1 AS bExito, 'Requisito legal actualizado correctamente.' AS vMensaje, @nid_req_legal AS id;
        END

        -- --------------------------------------------------
        -- ACCIÓN 'D': ELIMINADO LÓGICO
        -- --------------------------------------------------
        ELSE IF @cAccion = 'D'
        BEGIN
            UPDATE [dbo].[SN_REQUISITO_LEGAL]
            SET 
                [cflg_estado]       = 'I',
                [dfec_modificacion] = GETDATE(),
                [cusu_modificacion] = @cusu_usuario
            WHERE [nid_req_legal] = @nid_req_legal;

            SELECT 1 AS bExito, 'Requisito legal eliminado con éxito.' AS vMensaje, @nid_req_legal AS id;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO
PRINT '--> Procedimiento [dbo].[SP_SN_REQ_LEGAL_MNTO] creado con éxito.';
GO


-- ------------------------------------------------------------------------------------
-- 4. INSERTAR REGISTROS SEMILLA DE DEMOSTRACIÓN (SEED DATA)
-- ------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM [dbo].[SN_REQUISITO_LEGAL])
BEGIN
    INSERT INTO [dbo].[SN_REQUISITO_LEGAL] 
    ([citem], [vrequisito], [vtema], [vambito], [vtipo], [vnorma], [varticulo], [ventidad], [vextracto_obligacion], [vevidencia_cumplimiento], [vestado], [vresponsable], [vfrecuencia], [devaluacion], [dproxeval], [dvencimiento], [vevidencia_archivo], [cflg_estado], [dfec_creacion], [cusu_creacion])
    VALUES
    ('1.1', 'Programa Anual de Capacitaciones SST (4 anuales)', 'Formación y capacitaciones', 'Seguridad y Salud en el Trabajo', 'Programa', 'Ley 29783 / D.S. 005-2012-TR', 'Art. 35', 'MINTRA', 'Registro automático de asistencia; 4 capacitaciones SST al año.', 'Reglamento Interno RISST y Actas', 'En proceso', 'Jefe SSOMA', 'Anual', '2026-01-15', '2026-12-15', '2026-12-31', 'PROGRAMA_CAPACITACION_SST.pdf', 'A', GETDATE(), 'ADMIN'),
    ('1.2', 'Capacitación al Comité de SST', 'Formación y capacitaciones', 'Seguridad y Salud en el Trabajo', 'Registro / Acta', 'Ley 29783', 'Art. 42', 'MINTRA', '1 capacitación anual al CSST con vigencia.', 'Certificado de formación CSST', 'Cumple', 'Jefe SSOMA', 'Anual', '2026-03-01', '2027-03-01', '2027-03-01', 'CERTIFICADO_CSST.pdf', 'A', GETDATE(), 'ADMIN'),
    ('2.1', 'Proceso de elecciones del CSST', 'Comité de SST', 'Seguridad y Salud en el Trabajo', 'Registro / Acta', 'R.M. 245-2021-TR', 'Art. 5', 'MINTRA', 'Elecciones y acta de instalación, vigencia no mayor a 2 años.', 'Acta de Elección e Instalación CSST', 'Cumple', 'Jefe SSOMA', '≤2 años', '2024-09-01', '2026-08-15', '2026-09-01', 'ACTA-CSST-2024.pdf', 'A', GETDATE(), 'ADMIN'),
    ('2.2', 'Actas de reunión ordinaria del CSST', 'Comité de SST', 'Seguridad y Salud en el Trabajo', 'Registro / Acta', 'Ley 29783', 'Art. 43', 'MINTRA', 'Reunión mensual con acta obligatoria en libro foliado.', 'Libro de Actas de Reunión CSST', 'En proceso', 'Secretario CSST', 'Mensual', '2026-07-10', '2026-08-10', NULL, 'ACTA_JULIO_CSST.pdf', 'A', GETDATE(), 'ADMIN'),
    ('3.1', 'Licencia de Funcionamiento Municipal Huachipa', 'Licencias y permisos municipales', 'Municipal', 'Licencia / Permiso', 'Ordenanza Municipal 124-MDS', 'Art. 12', 'Municipalidad', 'Vigencia indeterminada pero sujeta a fiscalización de defensa civil ITSE.', 'Licencia Original de Funcionamiento', 'Cumple', 'Gestión Legal', 'Única vez', '2023-05-10', '2026-11-10', NULL, 'LIC-HUACHIPA.pdf', 'A', GETDATE(), 'ADMIN');

    PRINT '--> Registros semilla insertados correctamente en [dbo].[SN_REQUISITO_LEGAL].';
END
GO

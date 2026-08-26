-- ===================================================================
-- SCRIPT DE CREACIÓN DE TABLA Y STORED PROCEDURES DE PROVEEDORES
-- SISTEMA INTEGRADO DE GESTIÓN PRECOTEX (SIG)
-- ===================================================================

USE [DBSecureNorm]
GO

-- 1. TABLA: SN_PROVEEDORES
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SN_PROVEEDORES]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[SN_PROVEEDORES](
    [id] [int] IDENTITY(1,1) NOT NULL,
    [razon] [varchar](250) NOT NULL,
    [ruc] [varchar](20) NOT NULL,
    [tipo] [varchar](50) NOT NULL, -- 'Bien', 'Servicio', 'Contratista'
    [proceso] [varchar](100) NULL,
    [contacto] [varchar](250) NULL,
    [homologacion] [varchar](50) NULL, -- 'Homologado', 'En evaluación', 'Observado', 'No apto'
    [desempeno] [varchar](50) NULL, -- 'Excelente', 'Bueno', 'Regular', 'Deficiente'
    [evaluacion] [date] NULL,
    [reeval] [date] NULL,
    -- Cumplimiento SST para Contratistas
    [sctr] [date] NULL,
    [induccion] [date] NULL,
    [iperc] [date] NULL,
    [seguro] [date] NULL,
    [fec_registro] [datetime] DEFAULT (getdate()),
    [flg_activo] [bit] DEFAULT (1),
    CONSTRAINT [PK_SN_PROVEEDORES] PRIMARY KEY CLUSTERED ([id] ASC)
)
END
GO

-- 2. STORED PROCEDURE: SP_SN_PROVEEDORES_LISTAR
IF OBJECT_ID('[dbo].[SP_SN_PROVEEDORES_LISTAR]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[SP_SN_PROVEEDORES_LISTAR];
GO

CREATE PROCEDURE [dbo].[SP_SN_PROVEEDORES_LISTAR]
    @sFiltro VARCHAR(100) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id,
        razon,
        ruc,
        tipo,
        proceso,
        contacto,
        homologacion,
        desempeno,
        CONVERT(VARCHAR(10), evaluacion, 120) AS evaluacion,
        CONVERT(VARCHAR(10), reeval, 120) AS reeval,
        CONVERT(VARCHAR(10), sctr, 120) AS sctr,
        CONVERT(VARCHAR(10), induccion, 120) AS induccion,
        CONVERT(VARCHAR(10), iperc, 120) AS iperc,
        CONVERT(VARCHAR(10), seguro, 120) AS seguro,
        fec_registro
    FROM dbo.SN_PROVEEDORES
    WHERE flg_activo = 1
      AND (@sFiltro = '' OR razon LIKE '%' + @sFiltro + '%' OR ruc LIKE '%' + @sFiltro + '%' OR proceso LIKE '%' + @sFiltro + '%')
    ORDER BY id DESC;
END
GO

-- 3. STORED PROCEDURE: SP_SN_PROVEEDORES_MANTO
IF OBJECT_ID('[dbo].[SP_SN_PROVEEDORES_MANTO]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[SP_SN_PROVEEDORES_MANTO];
GO

CREATE PROCEDURE [dbo].[SP_SN_PROVEEDORES_MANTO]
    @Accion VARCHAR(1), -- 'I': Insert, 'U': Update, 'D': Delete
    @Id INT = 0,
    @Razon VARCHAR(250) = '',
    @Ruc VARCHAR(20) = '',
    @Tipo VARCHAR(50) = '',
    @Proceso VARCHAR(100) = '',
    @Contacto VARCHAR(250) = '',
    @Homologacion VARCHAR(50) = '',
    @Desempeno VARCHAR(50) = '',
    @Evaluacion DATE = NULL,
    @Reeval DATE = NULL,
    @Sctr DATE = NULL,
    @Induccion DATE = NULL,
    @Iperc DATE = NULL,
    @Seguro DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Accion = 'I'
    BEGIN
        INSERT INTO dbo.SN_PROVEEDORES (
            razon, ruc, tipo, proceso, contacto, homologacion, desempeno, evaluacion, reeval, sctr, induccion, iperc, seguro
        ) VALUES (
            @Razon, @Ruc, @Tipo, @Proceso, @Contacto, @Homologacion, @Desempeno, @Evaluacion, @Reeval, @Sctr, @Induccion, @Iperc, @Seguro
        );
        SELECT SCOPE_IDENTITY() AS id, 'Proveedor registrado con éxito' AS mensaje;
    END
    ELSE IF @Accion = 'U'
    BEGIN
        UPDATE dbo.SN_PROVEEDORES
        SET razon = @Razon,
            ruc = @Ruc,
            tipo = @Tipo,
            proceso = @Proceso,
            contacto = @Contacto,
            homologacion = @Homologacion,
            desempeno = @Desempeno,
            evaluacion = @Evaluacion,
            reeval = @Reeval,
            sctr = @Sctr,
            induccion = @Induccion,
            iperc = @Iperc,
            seguro = @Seguro
        WHERE id = @Id;
        SELECT @Id AS id, 'Proveedor actualizado con éxito' AS mensaje;
    END
    ELSE IF @Accion = 'D'
    BEGIN
        UPDATE dbo.SN_PROVEEDORES SET flg_activo = 0 WHERE id = @Id;
        SELECT @Id AS id, 'Proveedor eliminado con éxito' AS mensaje;
    END
END
GO

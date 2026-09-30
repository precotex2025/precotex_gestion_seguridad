-- ===================================================================
-- SCRIPT DE CREACIÓN: TABLA Y PROCEDIMIENTOS DE AUDITORÍA Y ACCESOS
-- BASE DE DATOS: BDSecureNorm
-- AUTOR: SISTEMAS PRECOTEX S.A.C.
-- FECHA: 25/09/2026
-- ===================================================================

USE [BDSecureNorm]
GO

-- 1. CREACIÓN DE LA TABLA SN_Log_Acceso
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SN_Log_Acceso')
BEGIN
    CREATE TABLE dbo.SN_Log_Acceso (
        Id_Log BIGINT IDENTITY(1,1) PRIMARY KEY,
        Cod_Usuario VARCHAR(50) NOT NULL,
        Nom_Usuario VARCHAR(150) NULL,
        Puesto VARCHAR(200) NULL,
        Cod_Rol VARCHAR(20) NULL,
        Fec_Acceso DATETIME2 NOT NULL DEFAULT GETDATE(),
        Ip_Acceso VARCHAR(50) NULL,
        Estado VARCHAR(50) NULL DEFAULT 'Inicio de sesión',
        Flg_Activo BIT NOT NULL DEFAULT 1
    );

    CREATE NONCLUSTERED INDEX IX_SN_Log_Acceso_Fecha ON dbo.SN_Log_Acceso(Fec_Acceso DESC);
    CREATE NONCLUSTERED INDEX IX_SN_Log_Acceso_Usuario ON dbo.SN_Log_Acceso(Cod_Usuario);
    PRINT 'Tabla dbo.SN_Log_Acceso creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla dbo.SN_Log_Acceso ya existe.';
END
GO

-- 2. PROCEDIMIENTO PARA REGISTRAR LOG DE ACCESO
CREATE OR ALTER PROCEDURE dbo.SP_SN_LOG_ACCESO_GUARDAR
    @Cod_Usuario VARCHAR(50),
    @Nom_Usuario VARCHAR(150) = NULL,
    @Puesto VARCHAR(200) = NULL,
    @Cod_Rol VARCHAR(20) = NULL,
    @Fec_Acceso DATETIME2 = NULL,
    @Ip_Acceso VARCHAR(50) = NULL,
    @Estado VARCHAR(50) = 'Inicio de sesión'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Fec_Acceso IS NULL
        SET @Fec_Acceso = GETDATE();

    -- Si no viene nombre o puesto, intentar resolverlos desde SN_Usuario
    IF @Nom_Usuario IS NULL OR @Nom_Usuario = ''
    BEGIN
        SELECT TOP 1 @Nom_Usuario = Nom_Usuario, @Puesto = COALESCE(@Puesto, Denominacion)
        FROM dbo.SN_Usuario
        WHERE Cod_Usuario = @Cod_Usuario;
    END

    INSERT INTO dbo.SN_Log_Acceso (Cod_Usuario, Nom_Usuario, Puesto, Cod_Rol, Fec_Acceso, Ip_Acceso, Estado, Flg_Activo)
    VALUES (@Cod_Usuario, @Nom_Usuario, @Puesto, @Cod_Rol, @Fec_Acceso, @Ip_Acceso, @Estado, 1);

    SELECT SCOPE_IDENTITY() AS Id_Log;
END
GO

-- 3. PROCEDIMIENTO PARA LISTAR LOGS DE ACCESO
CREATE OR ALTER PROCEDURE dbo.SP_SN_LOG_ACCESO_LISTAR
    @Top INT = 50,
    @SoloUltimoPorUsuario BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @SoloUltimoPorUsuario = 1
    BEGIN
        WITH RankedLogs AS (
            SELECT 
                Id_Log,
                Cod_Usuario,
                Nom_Usuario,
                Puesto,
                Cod_Rol,
                Fec_Acceso,
                Ip_Acceso,
                Estado,
                ROW_NUMBER() OVER(PARTITION BY LOWER(Cod_Usuario) ORDER BY Fec_Acceso DESC) as rn
            FROM dbo.SN_Log_Acceso
            WHERE Flg_Activo = 1
              AND LOWER(Cod_Usuario) NOT IN ('admin', 'super administrador')
        )
        SELECT TOP (@Top)
            Id_Log,
            Cod_Usuario,
            Nom_Usuario,
            Puesto,
            Cod_Rol,
            Fec_Acceso,
            Ip_Acceso,
            Estado
        FROM RankedLogs
        WHERE rn = 1
        ORDER BY Fec_Acceso DESC;
    END
    ELSE
    BEGIN
        SELECT TOP (@Top)
            Id_Log,
            Cod_Usuario,
            Nom_Usuario,
            Puesto,
            Cod_Rol,
            Fec_Acceso,
            Ip_Acceso,
            Estado
        FROM dbo.SN_Log_Acceso
        WHERE Flg_Activo = 1
        ORDER BY Fec_Acceso DESC;
    END
END
GO

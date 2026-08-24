-- =========================================================================================
-- PRECOTEX SOMA - SCRIPT DEFINITIVO (SIN ERRORES DE CLAVE DUPLICADA)
-- =========================================================================================

-- 1. ASEGURAR COLUMNAS EN LA TABLA dbo.SN_Usuario
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

    PRINT 'Tabla dbo.SN_Usuario verificada.';
END
GO

-- 2. CREAR TRIGGER DEFINITIVO EN dbo.SN_Puesto (Evita duplicados automáticamente)
IF OBJECT_ID(N'[dbo].[TRG_SN_PUESTO_AUTO_USUARIO]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TRG_SN_PUESTO_AUTO_USUARIO];
GO

CREATE TRIGGER [dbo].[TRG_SN_PUESTO_AUTO_USUARIO]
ON [dbo].[SN_Puesto]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH NuevosUsuarios AS (
        SELECT
            LOWER(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(NULLIF(i.Puesto_Funciones, ''), i.Denominacion))), ' ', '.'), '@', '.')) AS Cod_Usuario,
            'Precotex2026!' AS [Password],
            LTRIM(RTRIM(ISNULL(NULLIF(i.Puesto_Funciones, ''), i.Denominacion))) AS Nom_Usuario,
            CASE WHEN i.Codigo_Nivel_Riesgo = 'Gerencial' THEN 1 ELSE 2 END AS Cod_Rol,
            CASE WHEN i.Codigo_Nivel_Riesgo = 'Gerencial' THEN 'ADMINISTRADOR' ELSE 'Usuario SOMA' END AS Des_Rol,
            '01' AS Cod_Empresa,
            'Precotex S.A.C.' AS Empresa,
            UPPER(SUBSTRING(ISNULL(i.Puesto_Descripcion, 'SOMA'), 1, 10)) AS Tip_Trabajador,
            'T' + RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 900 + 100 AS VARCHAR(10)), 3) AS Cod_Trabajador,
            i.Denominacion,
            LOWER(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(NULLIF(i.Puesto_Funciones, ''), i.Denominacion))), ' ', '.'), '@', '.')) + '@precotexperu.com' AS Email,
            1 AS Flg_Activo,
            ROW_NUMBER() OVER (
                PARTITION BY LOWER(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(NULLIF(i.Puesto_Funciones, ''), i.Denominacion))), ' ', '.'), '@', '.'))
                ORDER BY i.Codigo_Puesto DESC
            ) AS rn
        FROM INSERTED i
        WHERE ISNULL(i.Puesto_Funciones, i.Denominacion) IS NOT NULL
    )
    INSERT INTO [dbo].[SN_Usuario] (
        [Cod_Usuario], [Password], [Nom_Usuario], [Cod_Rol], [Des_Rol],
        [Cod_Empresa], [Empresa], [Tip_Trabajador], [Cod_Trabajador],
        [Denominacion], [Email], [Flg_Activo]
    )
    SELECT 
        nu.Cod_Usuario, nu.[Password], nu.Nom_Usuario, nu.Cod_Rol, nu.Des_Rol,
        nu.Cod_Empresa, nu.Empresa, nu.Tip_Trabajador, nu.Cod_Trabajador,
        nu.Denominacion, nu.Email, nu.Flg_Activo
    FROM NuevosUsuarios nu
    WHERE nu.rn = 1
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[SN_Usuario] u WHERE u.Cod_Usuario = nu.Cod_Usuario
      );
END
GO

PRINT 'Trigger TRG_SN_PUESTO_AUTO_USUARIO creado exitosamente.';
GO

-- 3. CONSULTAR LOS USUARIOS EXISTENTES EN dbo.SN_Usuario
SELECT Cod_Usuario, Nom_Usuario, Password, Denominacion, Email, Cod_Rol, Flg_Activo 
FROM [dbo].[SN_Usuario];
GO

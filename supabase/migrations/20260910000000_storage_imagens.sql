-- ====================================================================
-- SUPABASE MIGRATION: 20260910000000_storage_imagens.sql
--
-- Balde público para as imagens da vitrine: foto do professor, capa e logo.
--
-- Antes elas viravam data URL dentro da própria linha do professor. Uma foto
-- de celular de 4000px vira uns 3 MB de texto que o banco guarda, que entra
-- em toda consulta de professores e que TODO visitante baixa junto com a
-- página -- para exibir num quadrado de 400px. Com o balde, a linha guarda
-- só o endereço, e o arquivo é servido por CDN.
--
-- Leitura é pública porque a vitrine é pública: exigir sessão para ver a foto
-- do professor esconderia a imagem justamente de quem ela existe para
-- convencer.
--
-- Escrita é de quem está logado, e só dentro da própria pasta. O caminho é
-- 'professores/<id-do-professor>/<arquivo>', e a política compara a segunda
-- parte do caminho com o professor do usuário.
--
-- Idempotente.
-- ====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'imagens',
    'imagens',
    TRUE,
    5242880,  -- 5 MB: acima disso não é foto de site, é arquivo esquecido
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
   SET public             = EXCLUDED.public,
       file_size_limit    = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types;

-- --------------------------------------------------------------------
-- Quem pode fazer o quê
-- --------------------------------------------------------------------

DROP POLICY IF EXISTS "imagens: qualquer um lê"            ON storage.objects;
DROP POLICY IF EXISTS "imagens: logado envia na sua pasta" ON storage.objects;
DROP POLICY IF EXISTS "imagens: logado troca a sua"        ON storage.objects;
DROP POLICY IF EXISTS "imagens: logado apaga a sua"        ON storage.objects;

-- A vitrine é pública; as imagens dela também
CREATE POLICY "imagens: qualquer um lê"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'imagens');

/**
 * Escrever só na própria pasta.
 *
 * storage.foldername() devolve o caminho em partes: para
 * 'professores/<id>/capa.jpg' vem ARRAY['professores', '<id>'].
 * A comparação é com o teacher_id do usuário em system_users -- o mesmo
 * vínculo que o resto do sistema usa para decidir permissão.
 */
CREATE POLICY "imagens: logado envia na sua pasta"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'imagens'
        AND (storage.foldername(name))[1] = 'professores'
        AND (storage.foldername(name))[2] IN (
            SELECT su.teacher_id FROM public.system_users su
             WHERE su.auth_user_id = auth.uid() AND su.teacher_id IS NOT NULL
        )
    );

CREATE POLICY "imagens: logado troca a sua"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'imagens'
        AND (storage.foldername(name))[2] IN (
            SELECT su.teacher_id FROM public.system_users su
             WHERE su.auth_user_id = auth.uid() AND su.teacher_id IS NOT NULL
        )
    );

CREATE POLICY "imagens: logado apaga a sua"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'imagens'
        AND (storage.foldername(name))[2] IN (
            SELECT su.teacher_id FROM public.system_users su
             WHERE su.auth_user_id = auth.uid() AND su.teacher_id IS NOT NULL
        )
    );

-- ====================================================================
-- Para conferir depois de rodar:
--
--   SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'imagens';
--   SELECT policyname FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname LIKE 'imagens:%';
-- ====================================================================

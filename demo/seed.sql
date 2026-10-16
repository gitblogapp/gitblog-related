-- ONLY for an isolated local D1 database after applying GitBlog migrations.
INSERT INTO blogs(id,github_repo_id,github_full_name,name,pages_url,source_locale,status)
 VALUES('related-demo-1',900000001,'demo/blog','개발 노트','https://example.com','ko','active'),
 ('related-demo-2',900000002,'demo/other','다른 개발 노트','https://example.org','ko','active');
INSERT INTO posts(id,locale,blog_id,stable_key,title,excerpt,body_excerpt,canonical_url,tags,published_at,status) VALUES
 ('10000000-0000-4000-8000-000000000001','ko','related-demo-1','00000000-0000-4000-8000-000000000001','Svelte 컴포넌트 설계','컴포넌트의 경계를 나누는 방법','Svelte 컴포넌트 설계와 독립적인 UI','https://example.com/source','["svelte","컴포넌트"]','2026-01-01','active'),
 ('10000000-0000-4000-8000-000000000002','ko','related-demo-2','00000000-0000-4000-8000-000000000002','Svelte의 작은 컴포넌트','재사용 가능한 UI 설계','Svelte 컴포넌트 구조','https://example.org/components','["svelte"]','2026-01-02','active'),
 ('10000000-0000-4000-8000-000000000003','ko','related-demo-2','00000000-0000-4000-8000-000000000003','독립 위젯 개발','iframe과 컴포넌트 설계','Svelte 컴포넌트 설계 이야기','https://example.org/widget','[]','2026-01-03','active'),
 ('10000000-0000-4000-8000-000000000004','ko','related-demo-1','00000000-0000-4000-8000-000000000004','여름 여행','바다에서 보낸 하루','부산의 바닷가를 걸었다','https://example.com/travel','["여행"]','2026-01-04','active');

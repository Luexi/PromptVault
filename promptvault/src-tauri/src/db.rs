use rusqlite::{Connection, Result, params};
use rusqlite::types::Value;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct Prompt {
    pub id: i32,
    pub title: String,
    pub prompt_text: String,
    pub negative_prompt: String,
    pub model: String,
    pub image_path: Option<String>,
    pub thumbnail_path: Option<String>,
    pub dimensions: String,
    pub steps: Option<i32>,
    pub sampler: Option<String>,
    pub cfg_scale: Option<f64>,
    pub seed: Option<String>,
    pub tags: String,
    pub is_favorite: bool,
    pub collection_id: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct NewPrompt {
    pub title: String,
    pub prompt_text: String,
    pub negative_prompt: Option<String>,
    pub model: String,
    pub dimensions: Option<String>,
    pub steps: Option<i32>,
    pub sampler: Option<String>,
    pub cfg_scale: Option<f64>,
    pub seed: Option<String>,
    pub tags: Option<Vec<String>>,
    pub collection_id: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePrompt {
    pub title: Option<String>,
    pub prompt_text: Option<String>,
    pub negative_prompt: Option<String>,
    pub model: Option<String>,
    pub dimensions: Option<String>,
    pub steps: Option<i32>,
    pub sampler: Option<String>,
    pub cfg_scale: Option<f64>,
    pub seed: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub collection_id: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct Collection {
    pub id: i32,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub prompt_count: i32,
}

#[derive(Debug, Serialize)]
pub struct Model {
    pub id: i32,
    pub name: String,
    pub short_name: String,
    pub is_active: bool,
}

pub struct Database {
    conn: Connection,
    data_dir: PathBuf,
}

impl Database {
    pub fn new(app_handle: &tauri::AppHandle) -> std::result::Result<Self, Box<dyn std::error::Error>> {
        let data_dir = if let Ok(doc_dir) = app_handle.path().document_dir() {
            doc_dir.join("PromptVault")
        } else {
            app_handle.path().app_data_dir()?
        };
        
        fs::create_dir_all(&data_dir)?;
        fs::create_dir_all(data_dir.join("images"))?;
        fs::create_dir_all(data_dir.join("thumbnails"))?;

        let db_path = data_dir.join("promptvault.db");
        let conn = Connection::open(&db_path)?;

        let db = Self { conn, data_dir };
        db.initialize_tables()?;
        db.insert_default_data()?;
        
        Ok(db)
    }

    fn initialize_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                prompt_text TEXT NOT NULL,
                negative_prompt TEXT DEFAULT '',
                model TEXT NOT NULL,
                image_path TEXT,
                thumbnail_path TEXT,
                dimensions TEXT DEFAULT '1:1',
                steps INTEGER,
                sampler TEXT,
                cfg_scale REAL,
                seed TEXT,
                tags TEXT DEFAULT '[]',
                is_favorite INTEGER DEFAULT 0,
                collection_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (collection_id) REFERENCES collections(id)
            );

            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                icon TEXT DEFAULT 'folder',
                color TEXT DEFAULT '#6b7280',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                short_name TEXT,
                is_active INTEGER DEFAULT 1
            );

            CREATE INDEX IF NOT EXISTS idx_prompts_model ON prompts(model);
            CREATE INDEX IF NOT EXISTS idx_prompts_collection ON prompts(collection_id);
            CREATE INDEX IF NOT EXISTS idx_prompts_favorite ON prompts(is_favorite);
            CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at);"
        )?;
        Ok(())
    }

    fn insert_default_data(&self) -> Result<()> {
        let models = [
            ("Gemini", "Gemini"),
            ("Chat GPT", "GPT"),
            ("Stable Diffusion XL", "SDXL"),
            ("Midjourney V6", "MJ"),
            ("DALL-E 3", "DALL-E"),
            ("Flux Pro", "Flux"),
            ("Flux.1", "Flux.1"),
            ("Leonardo AI", "Leo"),
            ("Firefly", "Adobe"),
        ];

        for (name, short) in models.iter() {
            self.conn.execute(
                "INSERT OR IGNORE INTO models (name, short_name) VALUES (?1, ?2)",
                params![name, short],
            )?;
        }
        Ok(())
    }

    pub fn get_all_prompts(&self, filter: Option<&str>, collection_id: Option<i32>) -> Result<Vec<Prompt>> {
        let mut sql = "SELECT * FROM prompts WHERE 1=1".to_string();
        let mut params: Vec<Value> = Vec::new();

        if let Some(model) = filter {
            sql.push_str(" AND model = ?");
            params.push(Value::from(model.to_string()));
        }

        if let Some(coll_id) = collection_id {
            sql.push_str(" AND collection_id = ?");
            params.push(Value::from(coll_id));
        }

        sql.push_str(" ORDER BY created_at DESC");

        let mut stmt = self.conn.prepare(&sql)?;
        let prompt_iter = stmt.query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(Prompt {
                id: row.get(0)?,
                title: row.get(1)?,
                prompt_text: row.get(2)?,
                negative_prompt: row.get(3)?,
                model: row.get(4)?,
                image_path: row.get(5)?,
                thumbnail_path: row.get(6)?,
                dimensions: row.get(7)?,
                steps: row.get(8)?,
                sampler: row.get(9)?,
                cfg_scale: row.get(10)?,
                seed: row.get(11)?,
                tags: row.get(12)?,
                is_favorite: row.get::<_, i32>(13)? != 0,
                collection_id: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?;

        prompt_iter.collect()
    }

    pub fn get_prompt_by_id(&self, id: i32) -> Result<Prompt> {
        self.conn.query_row(
            "SELECT * FROM prompts WHERE id = ?",
            params![id],
            |row| {
                Ok(Prompt {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    prompt_text: row.get(2)?,
                    negative_prompt: row.get(3)?,
                    model: row.get(4)?,
                    image_path: row.get(5)?,
                    thumbnail_path: row.get(6)?,
                    dimensions: row.get(7)?,
                    steps: row.get(8)?,
                    sampler: row.get(9)?,
                    cfg_scale: row.get(10)?,
                    seed: row.get(11)?,
                    tags: row.get(12)?,
                    is_favorite: row.get::<_, i32>(13)? != 0,
                    collection_id: row.get(14)?,
                    created_at: row.get(15)?,
                    updated_at: row.get(16)?,
                })
            },
        )
    }

    pub fn create_prompt(&self, prompt: &NewPrompt, image_path: Option<&str>, thumbnail_path: Option<&str>) -> Result<Prompt> {
        let tags_json = serde_json::to_string(&prompt.tags.clone().unwrap_or_default())
            .unwrap_or_else(|_| "[]".to_string());

        self.conn.execute(
            "INSERT INTO prompts (title, prompt_text, negative_prompt, model, image_path, thumbnail_path, 
             dimensions, steps, sampler, cfg_scale, seed, tags, collection_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                prompt.title,
                prompt.prompt_text,
                prompt.negative_prompt.as_deref().unwrap_or(""),
                prompt.model,
                image_path,
                thumbnail_path,
                prompt.dimensions.as_deref().unwrap_or("1:1"),
                prompt.steps,
                prompt.sampler,
                prompt.cfg_scale,
                prompt.seed,
                tags_json,
                prompt.collection_id,
            ],
        )?;

        let id = self.conn.last_insert_rowid() as i32;
        self.get_prompt_by_id(id)
    }

    pub fn update_prompt(&self, id: i32, prompt: &UpdatePrompt) -> Result<Prompt> {
        let existing = self.get_prompt_by_id(id)?;
        
        let tags_json = prompt.tags.as_ref()
            .map(|t| serde_json::to_string(t).unwrap_or_else(|_| "[]".to_string()))
            .unwrap_or(existing.tags);

        self.conn.execute(
            "UPDATE prompts SET 
             title = COALESCE(?1, title),
             prompt_text = COALESCE(?2, prompt_text),
             negative_prompt = COALESCE(?3, negative_prompt),
             model = COALESCE(?4, model),
             dimensions = COALESCE(?5, dimensions),
             steps = COALESCE(?6, steps),
             sampler = COALESCE(?7, sampler),
             cfg_scale = COALESCE(?8, cfg_scale),
             seed = COALESCE(?9, seed),
             tags = COALESCE(?10, tags),
             is_favorite = COALESCE(?11, is_favorite),
             collection_id = COALESCE(?12, collection_id),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?13",
            params![
                prompt.title,
                prompt.prompt_text,
                prompt.negative_prompt,
                prompt.model,
                prompt.dimensions,
                prompt.steps,
                prompt.sampler,
                prompt.cfg_scale,
                prompt.seed,
                tags_json,
                prompt.is_favorite.map(|f| if f { 1 } else { 0 }),
                prompt.collection_id,
                id,
            ],
        )?;

        self.get_prompt_by_id(id)
    }

    pub fn delete_prompt(&self, id: i32) -> Result<()> {
        if let Ok(prompt) = self.get_prompt_by_id(id) {
            if let Some(image_path) = prompt.image_path {
                let _ = fs::remove_file(self.data_dir.join(&image_path));
            }
            if let Some(thumbnail_path) = prompt.thumbnail_path {
                let _ = fs::remove_file(self.data_dir.join(&thumbnail_path));
            }
        }
        
        self.conn.execute("DELETE FROM prompts WHERE id = ?", params![id])?;
        Ok(())
    }

    pub fn toggle_favorite(&self, id: i32) -> Result<bool> {
        let current: bool = self.conn.query_row(
            "SELECT is_favorite FROM prompts WHERE id = ?",
            params![id],
            |row| row.get::<_, i32>(0).map(|v| v != 0),
        )?;
        
        let new_value = !current;
        self.conn.execute(
            "UPDATE prompts SET is_favorite = ? WHERE id = ?",
            params![if new_value { 1 } else { 0 }, id],
        )?;
        
        Ok(new_value)
    }

    pub fn search_prompts(&self, query: &str) -> Result<Vec<Prompt>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT * FROM prompts WHERE 
             title LIKE ?1 OR prompt_text LIKE ?1 OR tags LIKE ?1
             ORDER BY created_at DESC"
        )?;
        
        let prompt_iter = stmt.query_map(params![search_pattern], |row| {
            Ok(Prompt {
                id: row.get(0)?,
                title: row.get(1)?,
                prompt_text: row.get(2)?,
                negative_prompt: row.get(3)?,
                model: row.get(4)?,
                image_path: row.get(5)?,
                thumbnail_path: row.get(6)?,
                dimensions: row.get(7)?,
                steps: row.get(8)?,
                sampler: row.get(9)?,
                cfg_scale: row.get(10)?,
                seed: row.get(11)?,
                tags: row.get(12)?,
                is_favorite: row.get::<_, i32>(13)? != 0,
                collection_id: row.get(14)?,
                created_at: row.get(15)?,
                updated_at: row.get(16)?,
            })
        })?;

        prompt_iter.collect()
    }

    pub fn get_collections(&self) -> Result<Vec<Collection>> {
        let mut stmt = self.conn.prepare(
            "SELECT c.*, COUNT(p.id) as prompt_count 
             FROM collections c
             LEFT JOIN prompts p ON c.id = p.collection_id
             GROUP BY c.id
             ORDER BY c.name"
        )?;
        
        let coll_iter = stmt.query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                prompt_count: row.get(4)?,
            })
        })?;

        coll_iter.collect()
    }

    pub fn create_collection(&self, name: &str) -> Result<Collection> {
        let colors = ["#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EC4899", "#EF4444"];
        let color = colors[name.len() % colors.len()];

        self.conn.execute(
            "INSERT INTO collections (name, color) VALUES (?1, ?2)",
            params![name, color],
        )?;

        let id = self.conn.last_insert_rowid() as i32;
        
        Ok(Collection {
            id,
            name: name.to_string(),
            icon: "folder".to_string(),
            color: color.to_string(),
            prompt_count: 0,
        })
    }

    pub fn get_models(&self) -> Result<Vec<Model>> {
        let mut stmt = self.conn.prepare(
            "SELECT * FROM models WHERE is_active = 1 ORDER BY name"
        )?;
        
        let model_iter = stmt.query_map([], |row| {
            Ok(Model {
                id: row.get(0)?,
                name: row.get(1)?,
                short_name: row.get(2)?,
                is_active: row.get::<_, i32>(3)? != 0,
            })
        })?;

        model_iter.collect()
    }

    pub fn get_data_dir(&self) -> &PathBuf {
        &self.data_dir
    }
}

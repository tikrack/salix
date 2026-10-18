# orm-salam

A small, complete ORM written in the [Salam](https://salamlang.ir) programming
language. It runs on **SQLite**, **MySQL/MariaDB** and **PostgreSQL** through
the standard `db.*` drivers, and the engine and its credentials come from an
INI configuration file.

```
orm-salam/
├── main.salam        end-to-end demo: migrations, CRUD, queries, relations, transactions
├── src/orm.salam     the ORM library (package `orm`)
├── tests/orm_test.salam  in-memory SQLite test suite (50 assertions)
├── orm.ini           configuration: engine + credentials
├── Makefile          run / build / format / check / clean
├── LICENSE           MIT
└── README.md
```

## Quick start

```sh
salam run main.salam
```

That reads `orm.ini`, opens the configured database, and runs the whole tour
demonstrated against SQLite by default. To switch engine, edit `orm.ini` only —
no code changes:

```ini
[database]
engine = postgres
host = 127.0.0.1
port = 5432
user = postgres
password = secret
name = orm_demo
```

## Requirements

- The Salam toolchain (`salam run`, `salam build`, …).
- For SQLite: the `sqlite3` shared library (bundled with the toolchain).
- For MySQL: a reachable MySQL/MariaDB server.
- For PostgreSQL: a reachable PostgreSQL server.

## Configuration

All settings live under the `[database]` section of `orm.ini`:

| Key        | Used by              | Meaning                                  |
| ---------- | -------------------- | ---------------------------------------- |
| `engine`   | all                  | `sqlite`, `mysql` or `postgres`          |
| `path`     | sqlite               | database file (e.g. `orm_demo.db`)       |
| `host`     | mysql, postgres      | server host                              |
| `port`     | mysql, postgres      | server port                              |
| `user`     | mysql, postgres      | user name                                |
| `password` | mysql, postgres      | password                                 |
| `name`     | mysql, postgres      | database name                            |
| `debug`    | all                  | print every statement the ORM runs       |

`LoadConfig` accepts the aliases `sqlite3`, `mariadb`, `pgsql`, `postgresql`
and `pg` as well. A missing config file yields SQLite defaults.

## Defining a model

A model is a struct that implements the `Model` interface: five methods that
describe the table and move values in and out by column name.

```salam
struct User:
    pub id: i64 = 0
    pub name: str = ""
    pub email: str = ""
    pub age: i64 = 0

    pub func Table(): str:
        ret "users"
    end

    pub func ColumnCount(): int:
        ret 4
    end

    // Column(i) declares column i: its name, type and constraints.
    pub func Column(i: int): orm.Column:
        if i == 0: ret orm.AutoKeyCol("id", "i64") end
        if i == 1: ret orm.NotNull(orm.NewColumn("name", "text")) end
        if i == 2: ret orm.Unique(orm.NewColumn("email", "text")) end
        ret orm.NewColumn("age", "i64")
    end

    // Get returns the value of one column as a dynamic orm.Value.
    pub func Get(col: str): orm.Value:
        if col == "id": ret orm.Value.Int(this.id) end
        if col == "name": ret orm.Value.Text(this.name) end
        if col == "email": ret orm.Value.Text(this.email) end
        if col == "age": ret orm.Value.Int(this.age) end
        ret orm.Value {}
    end

    // Set stores one dynamic orm.Value into a column.
    pub func Set(col: str, v: orm.Value): bool:
        if col == "id":
            this.id = v.AsInt()
            ret true
        end
        if col == "name":
            this.name = v.AsText()
            ret true
        end
        if col == "email":
            this.email = v.AsText()
            ret true
        end
        if col == "age":
            this.age = v.AsInt()
            ret true
        end
        ret false
    end
end
```

Column types are portable names, mapped per engine by `orm.MapType`:

| Logical type  | SQLite            | MySQL       | PostgreSQL       |
| ------------- | ----------------- | ----------- | ---------------- |
| `int` / `i32` | `INTEGER`         | `INT`       | `INTEGER`        |
| `i64`         | `INTEGER`         | `BIGINT`    | `BIGINT`         |
| `float`/`f64` | `REAL`            | `DOUBLE`    | `DOUBLE PRECISION` |
| `bool`        | `INTEGER`         | `TINYINT(1)`| `BOOLEAN`        |
| `blob`        | `BLOB`            | `BLOB`      | `BYTEA`          |
| anything else | `TEXT`            | `TEXT`      | `TEXT`           |

Column helpers: `NewColumn`, `AutoKeyCol`, `PrimaryKeyCol`, `NotNull`,
`Unique`, `WithDefault`. An auto key becomes `INTEGER PRIMARY KEY AUTOINCREMENT`
on SQLite, `BIGINT AUTO_INCREMENT PRIMARY KEY` on MySQL, and
`BIGSERIAL PRIMARY KEY` on PostgreSQL.

## Opening a session

```salam
cfg := orm.LoadConfig("orm.ini")
s := orm.Open(cfg)
defer s.Close()
if not s.Ok():
    printerrln "cannot open database:", s.Error()
    ret 1
end
```

`OpenFile(path)` is a shortcut for a SQLite file, and `Wrap(conn, engine, debug)`
adopts an existing `dyn db.Connection`.

## Repository

`NewRepo(Model {}, session)` returns a typed `Repo<T>`:

```salam
users := orm.NewRepo(User {}, s)
_ := users.CreateTable()      // or DropTableIfExists() first

id := users.Save(User { name = "Ali", email = "ali@example.com", age = 30 })
_ := users.Update(User { id = id, name = "Ali Reza", email = "ali@example.com", age = 31 })
_ := users.Delete(id)

mut u := User {}
if users.Find(id, u):
    println u.name
end
```

`Save` returns the new row id: the native last-insert id on SQLite and MySQL,
and `RETURNING <pk>` on PostgreSQL (which has no last insert id).

`SaveMany(items)` inserts a batch inside one transaction and returns the number
of rows written.

### Querying

```salam
all    := users.All()
some   := users.List(orm.Ge(s, "age", orm.Value.Int(30)), orm.Desc(s, "age"), 10)
page   := users.Page("", orm.Asc(s, "id"), 20, 40)
count  := users.Total("")
exists := users.Exists(id)
raw    := users.Scalar("SELECT SUM(views) FROM posts")
mut first := User {}
found  := users.First(orm.Gt(s, "age", orm.Value.Int(18)), orm.Desc(s, "age"), first)
```

Aggregates over a numeric column: `users.Sum("age", where)`,
`users.Max("age", where)`, `users.Min("age", where)`. Bulk updates use
`users.UpdateWhere("age = 0", where)` and `users.DeleteWhere(where)`.

Conditions are built with the session so identifiers and literals are quoted
for the active engine: `Eq Ne Lt Le Gt Ge Like InList Between IsNull
IsNotNull`, combined with `And(parts)`, `Or(parts)`, `Not(cond)` and `Raw(sql)`.
Order with `Asc(s, col)` / `Desc(s, col)`.

For ad-hoc SQL use `s.Query(sql)` (returns `Vector<Row>`) or `s.One(sql)`:

```salam
rows := s.Query("SELECT name, age FROM users ORDER BY age DESC")
each row in rows:
    println row.Text("name"), row.Int("age"), row.IsNull("age")
    row.Free()
end
rows.free()
```

## Migrations

```salam
mut m := orm.NewMigrator()
defer m.items.free()
orm.AddMigration(m, 1, "create_users",
    "CREATE TABLE users (...)",
    "DROP TABLE users")
applied := orm.Migrate(s, m)
version := orm.SchemaVersion(s)
```

## Transactions

```salam
mut stmts := Vector {} as Vector<str>
stmts.push(orm.InsertSQL(s, "users", someUser))
stmts.push("UPDATE users SET age = 0 WHERE id = 9")
ok := orm.InTx(s, stmts)     // commits all, or rolls back on the first failure
```

## API summary

Core types: `Value`, `Column`, `Row`, `Config`, `Session`, `Model`,
`SchemaBuilder`, `Migration`, `Migrator`, `Repo<T>`.

Key functions: `LoadConfig Open OpenFile Wrap NewRepo NewSchema NewMigrator
AddMigration Migrate MigratePending SchemaVersion HasTable
CreateTableSQL InsertSQL UpdateSQL SelectSQL CountSQL
ReadRows FreeRows ValueFromRow Columns MapType NormalizeEngine InTx`
plus the condition and ordering builders above.

## Notes and limits

- **Identifiers** are quoted with `"` on SQLite/PostgreSQL and `` ` `` on MySQL;
  literals go through the driver's `Quote`, which handles escaping and
  backslashes correctly on MySQL.
- **`int` is 32-bit.** Model integer columns are declared `i64` so SQL `BIGINT`
  and Salam `i64` line up for ids, counts and timestamps.
- **PostgreSQL results are materialised**, so page large tables with
  `List(..., limit)` or `Page(...)` rather than scanning everything at once.
- **MySQL connections are not thread-safe**: give each thread its own
  connection and call `LibraryInit()` / `ThreadInit()` as described in the
  Salam database guide.
- The ORM renders SQL directly from the model's values. Values are quoted by
  the driver, so they are safe; never splice untrusted text into a `where`
  string by hand — build it with the condition helpers.

## License

MIT — see [LICENSE](LICENSE).

#!/usr/bin/env bash
set -euo pipefail

PROJECT="$HOME/Projects/orm-salam"

mkdir -p "$PROJECT/src" "$PROJECT/scripts"
cd "$PROJECT"

# ---------------------------------------------------------------- step 1
cat > .gitignore <<'EOF'
orm_demo
*.db
*.o
*.out
EOF

git init -b main
git add .gitignore
git commit -m "chore: scaffold project and gitignore"

# ---------------------------------------------------------------- step 2
cat > src/orm.salam <<'EOF'
PASTE_SRC_ORM_HERE
EOF

git add src/orm.salam
git commit -m "feat(orm): engine-agnostic value, row, session, model, repo, schema and migrations"

# ---------------------------------------------------------------- step 3
cat > orm.ini <<'EOF'
[database]
engine = sqlite
path = orm_demo.db
debug = false
EOF

git add orm.ini
git commit -m "feat(config): read engine and credentials from orm.ini"

# ---------------------------------------------------------------- step 4
cat > main.salam <<'EOF'
PASTE_MAIN_HERE
EOF

git add main.salam
git commit -m "feat(demo): sqlite CRUD, query conditions, schema and migration example"

# ---------------------------------------------------------------- step 5
cat > Makefile <<'EOF'
SALAM ?= salam

.PHONY: check build run fmt clean

check:
	$(SALAM) check main.salam

build:
	$(SALAM) build main.salam --output=orm_demo

run:
	$(SALAM) run main.salam

fmt:
	$(SALAM) format src/orm.salam
	$(SALAM) format main.salam

clean:
	rm -f orm_demo orm_demo.db
EOF

git add Makefile
git commit -m "chore(build): add Makefile targets"

# ---------------------------------------------------------------- step 6
cat > LICENSE <<'EOF'
MIT License

Copyright (c) 2026 Salam ORM contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "docs: add MIT license"

# ---------------------------------------------------------------- step 7
cat > README.md <<'EOF'
PASTE_README_HERE
EOF

git add README.md
git commit -m "docs: API reference and multi-engine guide"

echo
echo "Repository ready: $PROJECT"
git --no-pager log --oneline
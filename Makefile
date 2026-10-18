# Convenience targets around the Salam toolchain.
#
#   make run     build and run the demo (engine from orm.ini)
#   make build   compile a native executable named orm_demo
#   make format  format every Salam source in place
#   make check   type-check the program without codegen
#   make clean   remove build artifacts and local databases

ENTRY   := main.salam
BIN     := orm_demo
SOURCES := $(ENTRY) src/orm.salam

.PHONY: run build format check clean

run:
	salam run $(ENTRY)

build:
	salam build $(ENTRY) --output=$(BIN)

format:
	salam format .

check:
	salam inspect $(ENTRY) --emit-symbol > /dev/null

clean:
	rm -f $(BIN) *.db *.sqlite *.sqlite3 *.o *.out

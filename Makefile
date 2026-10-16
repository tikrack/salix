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

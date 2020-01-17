:dango: zly is a yaml assembly. You can split a large yaml file into many fragments.
It is very useful with writing a swagger API document. 
You can refer yaml piece from relative path or absolute path.
Think about that when you try to write a swagger document with more that 100 apis, how large the yaml file will be. It is hard to edit and make giddy.

### Install 

`npm i -g zly`

If you have not installed node.js env, here is a [binary file](https://github.com) with simple function. 


### Get-started

```
Usage: index [options]

Options:
  -V, --version        output the version number
  -o, --output <path>  put the result to file
  -w, --workspace      yaml file root path
  -f, --format <type>  format output style, yaml or json (default: "yaml")
  -p, --pretty         pretty out put
  -s, --server         start a swagger ui server
  -e, --extname <ext>  extend name, split with comma
  -h, --help           output usage information
 ```
 
 ### demo
 
- import yaml file
    `$ref: relative/path/some.yaml`
- structure
```
├── definitions
│   ├── Error.yaml
│   ├── Pet.yaml
│   └── index.yaml
├── entry.yaml
└── routers
    ├── index.yaml
    └── pets
        ├── $id.yaml
        └── list.yaml
```
The entry file refer two file from `definitions/index.yaml` and `routers/index.yaml`

```
paths:
  $ref: routers/index.yaml
components:
  $ref: definitions/index.yaml
```
for routers/index.yaml:

```
/pets:
  $ref: pets/list.yaml
/pets/{petId}:
  $ref: pets/$id.yaml

```

run with `zly -s entry.yaml`

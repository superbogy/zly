:dango: zly is a yaml assembly parser. You can split a large yaml file into small fragments.
It is very useful for writing a swagger API document. 
You can import yaml piece from relative path or absolute path.


### Install 

`npm i -g @superbogy/zly`

### Get-started



```
Usage: zly [options]

Options:
  -V, --version        output the version number
  -o, --output <path>  put the result to file
  -w, --workspace      yaml file root path
  -f, --format <type>  format output style, yaml or json (default: "yaml")
  -p, --pretty         pretty out put
  -s, --server         start a swagger ui
  -e, --extname <ext>  extend name, split with comma
  -h, --help           output usage information
 ```
 
 ### Get-started

- preview a swagger yaml file: `zly -s api-spec.yaml`

- import yaml file: `$ref: relative/path/some.yaml`

### Demo

clone this project and run `zly -s test/example/index.yaml`

![zly](https://user-images.githubusercontent.com/6630736/74917614-bca7c200-5402-11ea-8dd5-655e375da546.gif)

structure

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


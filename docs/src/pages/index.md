# Introduction

### 什么是 Mahiro ?

Mahiro 是一个 [OPQBot](https://github.com/opq-osc/OPQ) 的 JavaScript SDK ：

 - 🚀 实现对消息的收发、管理、过滤

 - 🌐 作为网关，统一管理群组、插件

 - 🖇️ 提供 Python Bridge 对接 Python 插件

### 什么时候建议使用 Mahiro ?

 - 历史插件由 Python 编写，希望迁移到 Mahiro ，使插件由网关统一管理

 - 更偏好消息管理，希望在消息的生命周期上有所干预和作为

 - 希望提升 IO 性能

 - 希望复用庞大的 JavaScript 生态

### 什么时候不建议用 Mahiro ?

 - 内存极其有限，不支持运行 Nodejs / Python 

 - 历史插件的语言不是 JavaScript 或 Python ，或和 SDK 功能有复杂的耦合，迁移困难

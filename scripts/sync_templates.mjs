#!/usr/bin/env node
// web/ 의 컨셉 페이지·엔진·맵을 스킬 폴더(skill/virtual-office/templates)로 복사한다. 스킬은 이 폴더만으로 동작해야 한다(에셋은 CDN).
import fs from 'node:fs'
import path from 'node:path'
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const out = path.join(root, 'skill', 'virtual-office', 'templates')
fs.mkdirSync(out, { recursive: true })
for (const f of ['diorama.html', 'saas.html', 'rpg.html', 'control.html', 'building.html', 'engine.js', 'engine.css', 'maps.js', 'maps-v3.js']) fs.copyFileSync(path.join(root, 'web', f), path.join(out, f))
console.log('synced templates →', out)

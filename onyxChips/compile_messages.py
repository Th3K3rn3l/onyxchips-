#!/usr/bin/env python
"""
Скрипт для компиляции .po файлов в .mo без использования gettext
"""
import os
import struct
import array
from pathlib import Path

def generate_mo_file(po_file, mo_file):
    """Компилирует .po файл в .mo файл"""

    # Читаем .po файл
    with open(po_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Парсим переводы
    translations = {}
    msgid = None
    msgstr = None
    in_msgid = False
    in_msgstr = False

    for line in lines:
        line = line.strip()

        if line.startswith('msgid "'):
            msgid = line[7:-1]
            in_msgid = True
            in_msgstr = False
        elif line.startswith('msgstr "'):
            msgstr = line[8:-1]
            in_msgstr = True
            in_msgid = False
            if msgid and msgstr:
                translations[msgid] = msgstr
        elif line.startswith('"') and line.endswith('"'):
            text = line[1:-1]
            if in_msgid:
                msgid += text
            elif in_msgstr:
                msgstr += text
        elif not line or line.startswith('#'):
            if msgid and msgstr:
                translations[msgid] = msgstr
            msgid = None
            msgstr = None
            in_msgid = False
            in_msgstr = False

    # Добавляем последний перевод
    if msgid and msgstr:
        translations[msgid] = msgstr

    # Удаляем пустые ключи
    translations = {k: v for k, v in translations.items() if k and v}

    # Создаем .mo файл
    keys = sorted([k for k in translations.keys() if k])  # Убираем пустые ключи

    # Создаем заголовок с метаданными
    header = (
        'Content-Type: text/plain; charset=UTF-8\n'
        'Content-Transfer-Encoding: 8bit\n'
    )

    # Добавляем заголовок как первую запись (пустой msgid)
    ids = b'\x00'
    strs = header.encode('utf-8') + b'\x00'

    for key in keys:
        # Добавляем msgid
        ids += key.encode('utf-8') + b'\x00'
        # Добавляем msgstr
        strs += translations[key].encode('utf-8') + b'\x00'

    # Создаем таблицу смещений (включая заголовок)
    num_entries = len(keys) + 1  # +1 для заголовка
    keystart = 7 * 4 + 16 * num_entries
    valuestart = keystart + len(ids)
    koffsets = []
    voffsets = []

    # Добавляем заголовок (пустой msgid)
    koffsets.append((0, keystart))
    voffsets.append((len(header.encode('utf-8')), valuestart))

    # Вычисляем смещения для ключей
    offset = 1  # Начинаем после пустого заголовка
    for key in keys:
        koffsets.append((len(key.encode('utf-8')), keystart + offset))
        offset += len(key.encode('utf-8')) + 1

    # Вычисляем смещения для значений
    offset = len(header.encode('utf-8')) + 1  # Начинаем после заголовка
    for key in keys:
        voffsets.append((len(translations[key].encode('utf-8')), valuestart + offset))
        offset += len(translations[key].encode('utf-8')) + 1

    # Формируем заголовок
    keyoffsets = b''.join([struct.pack('ii', length, offset) for length, offset in koffsets])
    valueoffsets = b''.join([struct.pack('ii', length, offset) for length, offset in voffsets])

    # Magic number для .mo файла
    magic = 0x950412de
    version = 0
    msgcount = num_entries
    masteridx = 7 * 4
    transidx = 7 * 4 + 8 * msgcount

    # Записываем .mo файл
    with open(mo_file, 'wb') as f:
        f.write(struct.pack('Iiiiiii',
                           magic,
                           version,
                           msgcount,
                           masteridx,
                           transidx,
                           0,  # hash table size
                           0   # hash table offset
                           ))
        f.write(keyoffsets)
        f.write(valueoffsets)
        f.write(ids)
        f.write(strs)

    print(f'Compiled: {po_file} -> {mo_file} ({len(translations)} translations)')

# Компилируем все .po файлы
locale_dir = Path(__file__).parent / 'locale'

for lang in ['ru', 'en', 'es']:
    po_file = locale_dir / lang / 'LC_MESSAGES' / 'django.po'
    mo_file = locale_dir / lang / 'LC_MESSAGES' / 'django.mo'

    if po_file.exists():
        generate_mo_file(po_file, mo_file)
    else:
        print(f'Warning: {po_file} not found')

print('\nAll translations compiled successfully!')

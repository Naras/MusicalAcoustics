# -*- coding: utf-8 -*-
"""
Transliteration utility for Indian languages.
"""

import os

from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate as trans_iast, SCHEMES

IndianLanguages = ('devanagari','bengali','gurmukhi','gujarati','oriya','tamizh','telugu','kannada','malayalam')
IndianUnicodeValue = [['devanagari'],['bengali'],['gurmukhi'],['gujarati'],['oriya'],['tamizh'],['telugu'],['kannada'],['malayalam']]
def detectLang(ch):
    start_end = {0:[0x0900,0x097F],1:[0x980, 0x9ff],2:[0xa00, 0xa7f], 3:[0xa80, 0xaff], \
             4:[0xb00, 0xb7f],5:[0xb80, 0xbff],6:[0xc00, 0xc7f],7:[0xc80, 0xcff],8:[0xd00, 0xd7f]}
    for k,v in start_end.items():
        ch_hex = ord(ch)
        if ch_hex >= v[0] and ch_hex <= v[1]:
            return k
    return None
def transliterate_char(ch, targetScript):
    ZWJ = u'\u200d'  # Zero Width Joiner
    ZWNJ = u'\u200c'  # Zero Width Non Joiner
    DANDA = u'\u0964'
    DOUBLE_DANDA = u'\u0965'
    if ord(ch) < 128: return ch  # ascii
    elif ch in [DANDA, DOUBLE_DANDA, ZWJ, ZWNJ]: return ch # extra devanagari chars
    else:
        return IndianUnicodeValue[targetScript][ord(ch) - ord(IndianUnicodeValue[detectLang(ch)][1])+1]
def transliterate(source, scriptTarget='devanagari'):
    if scriptTarget in IndianLanguages:
        for i,e in enumerate(IndianLanguages):
            if scriptTarget == e:
                trg = i
                break
        target = ''
        try:
            for s in source:
                t = ''
                for c in s:
                    t += transliterate_char(c, trg)
                target += t
        except Exception as e:
            raise Exception(f'transliterate - {e} char {s}/{c}({ord(c)}) source {source}')
        return target
    else:
        if scriptTarget != "devanagari": source = transliterate(source, 'devanagari')
        # print(f'transliterating {source}')
        if scriptTarget.upper() == 'IAST': return trans_iast(source, sanscript.DEVANAGARI, sanscript.IAST)
        else: return trans_iast(source, sanscript.DEVANAGARI, sanscript.ITRANS)
'''def init():
    for j in range(9):
        for i in range(0x0900, 0x097F):  # (0x0905,0x093A):
            IndianUnicodeValue[j].append(chr(i + 128 * j))
init()'''
for j in range(9):
    for i in range(0x0900, 0x097F):  # (0x0905,0x093A):
        IndianUnicodeValue[j].append(chr(i + 128 * j))

if __name__ == '__main__':
    text = "राशि"
    # print(f'Rashi {transliterate_text(text, "IAST")}')
    print(f"devanagari {text} IAST: {transliterate(text, 'IAST')} ITRANS: {transliterate(text, 'ITRANS')}")
    # print(f"devanagari {text} IAST: {trans_iast(transliterate(text, 'devanagari'), sanscript.DEVANAGARI, sanscript.IAST)} ITRANS: {trans_iast(transliterate(text, 'devanagari'), sanscript.DEVANAGARI, sanscript.ITRANS)}")
    # print(f'SCHEMES {SCHEMES[sanscript.DEVANAGARI]}\n{SCHEMES[sanscript.IAST]}')

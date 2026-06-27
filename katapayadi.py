
def decode_katapayadi(word):
    """Decode a Sanskrit word into a number using the Katapayadi system."""# Katapayadi Mapping
    katapayadi_map = {
    # 1: Ka-group, Ta-group, Pa-group, Ya
    'क':1, 'ख':2, 'ग':3, 'घ':4, 'ङ':5,
    'ट':1, 'ठ':2, 'ड':3, 'ढ':4, 'ण':5,
    'प':1, 'फ':2, 'ब':3, 'भ':4, 'म':5, 'य':1,

    # 2: Ra, La, Va, Sha, Sha, Sa, Ha
    'र':2, 'ल':3, 'व':4, 'श':5, 'ष':6, 'स':7, 'ह':8,

    # 0: Ja-group, Na, Nya, and all Vowels
    'च':6, 'छ':7, 'ज':8, 'झ':9, 'ञ':0,
    'त':6, 'थ':7, 'द':8, 'ध':9, 'न':0
}
    # print(f'{[(k, hex(ord(k))) for k in katapayadi_map.keys()]}')
          # f': print(f'{k} {ord(c) for c in k}')
    # katapayadi_map_kannada = {}
    # for k, v in katapayadi_map.items(): katapayadi_map_kannada[mytrans.transliterate(k, 'kannada')] = v

    katapayadi_map_kannada = {
    # 1: Ka-group, Ta-group, Pa-group, Ya
    'ಕ': 1, 'ಖ': 2, 'ಗ': 3, 'ಘ': 4, 'ಙ': 5,
    'ಟ': 1, 'ಠ': 2, 'ಡ': 3, 'ಢ': 4, 'ಣ': 5,
    'ಪ': 1, 'ಫ': 2, 'ಬ': 3, 'ಭ': 4, 'ಮ': 5, 'ಯ': 1,

    # 2: Ra, La, Va, Sha, Sha, Sa, Ha
    'ರ': 2, 'ಲ': 3, 'ವ': 4, 'ಶ': 5, 'ಷ': 6, 'ಸ': 7, 'ಹ': 8,

    # 0: Ja-group, Na, Nya, and all Vowels
    'ಚ': 6, 'ಛ': 7, 'ಜ': 8, 'ಝ': 9, 'ಞ': 0,
    'ತ': 6, 'ಥ': 7, 'ದ': 8, 'ಧ': 9, 'ನ': 0
}

    digits = []
    for char in word:
        if char in katapayadi_map: digits.append(str(katapayadi_map[char]))
    # The final decoded number is read from right to left (Ankanam Vamato Gathi)
    if digits:
        number_str = "".join(digits)[::-1]
        return int(number_str)
    return 0
def unicodePrints():
    # 1. Get Decimal Values(Integers)
    text = "Hi! 👋"
    for char in text: print(f"Character: {char} -> Unicode Decimal: {ord(char)}")
    text = "Python"
    for char in text:
        # :04X pads the hex value with zeros up to 4 characters in uppercase
        print(f"Character: {char} -> U+{ord(char):04X}")
    text = "Café"
    # Get decimals
    decimals = [ord(char) for char in text]
    print("Decimals:", decimals)  # Output: [67, 97, 102, 233]
    # Get standard Hex strings
    hex_values = [f"U+{ord(char):04X}" for char in text]
    print("Hex Values:", hex_values)  # Output: ['U+0043', 'U+0061', 'U+0066', 'U+00E9']
    text = "Python🐍"
    raw_escape = text.encode("unicode_escape").decode("utf-8")
    print(raw_escape)  # Output: Python\U0001f40d

if __name__ == '__main__':
    unicodePrints()
const trace = true;
export class Dart {
    #singleDartValue;
    #isDouble;
    #isTriple;
    /*
    supports the following formats:
    - "20" (single)
    - "D20" (double) or "d20"
    - "T20" (triple) or "t20"
    - "25" (single bullseye)
    - "D25" (double bullseye) or "d25"
    throws an error for invalid formats
    */
    constructor(valueString) {

        const match = valueString.match(/^(D|T|d|t)?(\d{1,2})$/);
        if (!match) {
            throw new Error("Invalid dart value: " + valueString +
                ". Must be a number between 0 and 20, or 25 for bullseye, optionally prefixed with 'D' or 'T'.");
        }
        const [, prefix, number] = match;
        const intValue = Number(number);
        switch (prefix) {
            case 'D':
            case 'd':
                this.#isDouble = true;
                this.#isTriple = false;
                if (intValue != 25 && (intValue < 0 || intValue > 20)) {
                    throw new Error("Invalid dart value: " + valueString + ". Prefix D must be between 0 and 20, or 25 for bullseye.");
                }
                this.#singleDartValue = intValue;
                break;
            case 'T':
            case 't':
                this.#isDouble = false;
                this.#isTriple = true;
                if (intValue < 0 || intValue > 20) {
                    throw new Error("Invalid dart value: " + valueString + ". Prefix T must be between 0 and 20.");
                }
                this.#singleDartValue = intValue;
                break;
            default:
                this.#isDouble = false;
                this.#isTriple = false;
                if (intValue != 25 && (intValue < 0 || intValue > 20)) {
                    throw new Error("Invalid dart value: " + valueString + ". Must be between 0 and 20, or 25 for bullseye.");
                }
                this.#singleDartValue = intValue;
        }





    }
    get value() {
        if (this.#isDouble) {
            return this.#singleDartValue * 2;
        } else if (this.#isTriple) {
            return this.#singleDartValue * 3;
        } else {
            return this.#singleDartValue;
        }
    }
    set singleDartValue(value) {
        throw new Error("Cannot set singleDartValue directly. Use the constructor to create a Dart instance.");
    }
    set isDouble(value) {
        throw new Error("Cannot set isDouble directly. Use the constructor to create a Dart instance.");
    }
    set isTriple(value) {
        throw new Error("Cannot set isTriple directly. Use the constructor to create a Dart instance.");
    }
    get isDouble() {
        return this.#isDouble;
    }
    get isTriple() {
        return this.#isTriple;
    }
    get singleDartValue() {
        return this.#singleDartValue;
    }

    toString() {
        if (this.#isDouble) {
            return `D${this.#singleDartValue}`;
        } else if (this.#isTriple) {
            return `T${this.#singleDartValue}`;
        } else {
            return `${this.#singleDartValue}`;
        }
    }

    /*
     creates an input field for dart values with validation and feedback messages.
        errorMessage: an element to display error messages
        goodMessage: an element to display good messages (optional)
        provideDart: a callback function to provide the Dart instance (optional)
    */
    static createInputField(errorMessage, goodMessage, provideDart) {
        const input = document.createElement('input');
        let dart = null;
        input.type = 'text';
        input.placeholder = 'dart (0, 20, D20, T20, 25, D25)';
        input.classList.add('align-right');
        input.classList.add('inputField');
        input.pattern = '^(D|T|d|t)?(\\d{1,2})$';
        input.addEventListener('input', (event) => {
            if (trace) console.log(`Input changed to: ${input.value}`);
            input.classList.remove("good", "error");
            provideDart(null);
            if (goodMessage && goodMessage !== undefined) {
                goodMessage.textContent = '';
            }
            errorMessage.textContent = '';
            if (input.value.length === 0) {
                return;
            }
            if (input.value.length > 3) {
                input.classList.add("error");
                errorMessage.textContent = 'Input too long. Maximum 3 characters.';
                return;
            }
            if (input.value.length === 1 &&
                (input.value === 'D' ||
                    input.value === 'T' ||
                    input.value === 'd' ||
                    input.value === 't' ||
                    input.value === '0' ||
                    input.value === '1' ||
                    input.value === '2' ||
                    input.value === '3' ||
                    input.value === '4' ||
                    input.value === '5' ||
                    input.value === '6' ||
                    input.value === '7' ||
                    input.value === '8' ||
                    input.value === '9')) {
                // Allow single digit numbers and D/T prefixes
                if (goodMessage && goodMessage !== undefined) {
                    goodMessage.textContent = 'Input: first character is valid';
                }
                return;
            } else {
                try {
                    dart = new Dart(input.value);
                    input.classList.add("good");
                    if (goodMessage && goodMessage !== undefined) {
                        goodMessage.textContent = `Input: Valid dart value: ${dart.value}`;
                    }

                    errorMessage.textContent = '';
                } catch (e) {
                    input.classList.add("error");
                    errorMessage.textContent = e.message;
                }
            }

        });
        input.addEventListener('change', () => {
            if (trace) console.log(`Input value: ${input.value}`);
            const value = input.value.trim();
            input.classList.remove("good", "error");
            if (value === '') {
                if (goodMessage && goodMessage !== undefined) {
                    goodMessage.textContent = '';
                }
                errorMessage.textContent = '';
                return;
            }
            try {
                dart = new Dart(value);
                input.classList.add("good");
                if (goodMessage && goodMessage !== undefined) {
                    goodMessage.textContent = `Change: Valid dart value: ${dart.value}`;
                }
                errorMessage.textContent = '';
                provideDart(dart);
            } catch (e) {
                input.classList.add("error");
                errorMessage.textContent = e.message;
                provideDart(null);
            }
        });
        return input;
    }
}

function testDartClass() {
    const testCases = [
        { input: "20", expectedValue: 20 },
        { input: "D20", expectedValue: 40 },
        { input: "d20", expectedValue: 40 },
        { input: "T20", expectedValue: 60 },
        { input: "t20", expectedValue: 60 },
        { input: "25", expectedValue: 25 },
        { input: "D25", expectedValue: 50 },
        { input: "d25", expectedValue: 50 },
        { input: "T25", expectedValue: 75 },
        { input: "t25", expectedValue: 75 },
        { input: "0", expectedValue: 0 },
        { input: "D0", expectedValue: 0 },
        { input: "T0", expectedValue: 0 }
    ];

    testCases.forEach(({ input, expectedValue }) => {
        const dart = new Dart(input);
        console.assert(dart.value === expectedValue, `Test failed for input ${input}: expected ${expectedValue}, got ${dart.value}`);
    });

    // Test invalid cases
    const invalidCases = [
        "21",
        "D21",
        "T21",
        "-1",
        "D-1",
        "T-1",
        "D26",
        "T26",
        "T25",
        "Dabc",
        "Tabc",
        "abc",
        "D",
        "T",
        "L10",
        "E7",
        "D25.5",
        "T25.5",
        "D25a",
        "T25a",
        "D 20"
    ];
    invalidCases.forEach((input) => {
        try {
            new Dart(input);
            console.assert(false, `Test failed for invalid input ${input}: expected an error, but no error was thrown.`);
        } catch (e) {
            console.assert(e instanceof Error, `Test failed for invalid input ${input}: expected an Error, got ${e}`);
        }
    });

    console.log("All tests passed!");
}
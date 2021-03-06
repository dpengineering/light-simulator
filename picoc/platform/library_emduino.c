#include "../interpreter.h"
#include "../picoc.h"
#include <unistd.h>
#include <string.h>

extern void analogWriteJS(int, int);
extern void digitalWriteJS(int, int);

void EmSetupFunc() {}

void EmPinMode(struct ParseState *Parser, struct Value *ReturnValue, struct Value **Param, int numArgs) {

}

void EmAnalogWrite(struct ParseState *Parser, struct Value *ReturnValue, struct Value **Param, int numArgs) {
  analogWriteJS(Param[0]->Val->Integer, Param[1]->Val->Integer);
}

void EmDigitalWrite(struct ParseState *Parser, struct Value *ReturnValue, struct Value **Param, int numArgs) {
  digitalWriteJS(Param[0]->Val->Integer, Param[1]->Val->Integer);
}

void EmDelay(struct ParseState *Parser, struct Value *ReturnValue, struct Value **Param, int numArgs) {
  usleep(Param[0]->Val->Integer * 1000);
}

struct LibraryFunction EmduinoFunctions[] =
  {
    {EmAnalogWrite, "void analogWrite(int, int);"},
    {EmDigitalWrite, "void digitalWrite(int, int);"},
    {EmPinMode, "void pinMode(int, int);"},
    {EmDelay, "void delay(int);"},
    {NULL, NULL}
  };

const char* DEFS = "#define OUTPUT 1 \n\
#define INPUT 0 \n\
#define HIGH 1 \n\
#define LOW 0 \n";

void PlatformLibraryInit() {
  IncludeRegister("Arduino.h", &EmSetupFunc, &EmduinoFunctions[0], NULL);
  PicocParse("Arduino.h", DEFS, strlen(DEFS), TRUE, TRUE, FALSE);
}

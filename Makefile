DIST_NAME = pagingbuffer
DEMO_PORT = 13111
DEMO_ROOT =

SCRIPT_FILES = \
	src/Attribute.ts \
	src/BufferPage.ts \
	src/demo.ts \
	src/doc.ts \
	src/index.ts \
	src/PageGroup.ts \
	src/PagingBuffer.ts

EXTRA_SCRIPTS = \
	src/frag.glsl \
	src/vert.glsl

include ./Makefile.microproject

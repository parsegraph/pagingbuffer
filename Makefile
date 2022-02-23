DIST_NAME = pagingbuffer

SCRIPT_FILES =  \
	src/BufferPage.ts \
	src/PageGroup.ts \
	src/index.ts \
	src/doc.ts \
	src/glsl.d.ts \
	src/PagingBuffer.ts \
	src/Attribute.ts \
	src/demo.ts \
	test/test.ts \
	test/test.js

EXTRA_SCRIPTS =  \
	src/vert.glsl \
	src/frag.glsl

include ./Makefile.microproject

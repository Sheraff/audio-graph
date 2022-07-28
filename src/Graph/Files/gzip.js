/* eslint-disable no-undef */


/**
 * @param {ArrayBuffer} byteArray
 * @param {"gzip" | "deflate" | "deflate-raw"} encoding
 */
export async function decompress(byteArray, encoding) {
	const cs = new DecompressionStream(encoding)
	const writer = cs.writable.getWriter()
	writer.write(byteArray)
	writer.close()
	const arrayBuffer = await new Response(cs.readable).arrayBuffer()
	return new TextDecoder().decode(arrayBuffer)
}

/**
 * @param {string} string
 * @param {"gzip" | "deflate" | "deflate-raw"} encoding
 */
export async function compress(string, encoding) {
	const byteArray = new TextEncoder().encode(string)
	const cs = new CompressionStream(encoding)
	const writer = cs.writable.getWriter()
	writer.write(byteArray)
	writer.close()
	return new Response(cs.readable).arrayBuffer()
}
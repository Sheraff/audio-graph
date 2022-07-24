interface A {
	kind: 'aaa',
	value: string
}

interface B {
	kind: 'bbb',
	value: number
}

class Parent {
	static field: A | B
}

class Child extends Parent {
	static {
		this.field = {kind: 'bbb', value: 0}
	}
}

export default Child
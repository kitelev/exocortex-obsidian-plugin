import { IRI } from "./IRI";

export class Literal {
  private readonly _value: string;
  private readonly _datatype?: IRI;
  private readonly _language?: string;

  constructor(value: string, datatype?: IRI, language?: string) {
    if (value.length === 0) {
      throw new Error("Literal value cannot be empty");
    }

    if (datatype && language) {
      throw new Error("Literal cannot have both datatype and language tag");
    }

    this._value = value;
    this._datatype = datatype;
    this._language = language ? language.toLowerCase() : undefined;
  }

  get value(): string {
    return this._value;
  }

  get datatype(): IRI | undefined {
    return this._datatype;
  }

  get language(): string | undefined {
    return this._language;
  }

  equals(other: Literal): boolean {
    if (this._value !== other._value) {
      return false;
    }

    if (this._datatype && other._datatype) {
      if (!this._datatype.equals(other._datatype)) {
        return false;
      }
    } else if (this._datatype || other._datatype) {
      return false;
    }

    if (this._language !== other._language) {
      return false;
    }

    return true;
  }

  toString(): string {
    let result = `"${this._value}"`;

    if (this._datatype) {
      result += `^^<${this._datatype.value}>`;
    } else if (this._language) {
      result += `@${this._language}`;
    }

    return result;
  }
}

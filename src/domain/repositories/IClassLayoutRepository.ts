import { ClassLayout } from "../entities/ClassLayout";
import { ClassName } from "../value-objects/ClassName";
import { AssetId } from "../value-objects/AssetId";

export interface IClassLayoutRepository {
  findByClass(className: ClassName): Promise<ClassLayout[]>;
  findById(id: AssetId): Promise<ClassLayout | null>;
  findAll(): Promise<ClassLayout[]>;
  findEnabledByClass(className: ClassName): Promise<ClassLayout[]>;
  save(layout: ClassLayout): Promise<void>;
  delete(id: AssetId): Promise<void>;
}

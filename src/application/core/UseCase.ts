import { Result } from "../../domain/core/Result";

/**
 * Base interface for Use Cases
 * Following Clean Architecture principles
 */
export interface UseCase<IRequest, IResponse> {
  execute(request: IRequest): Promise<Result<IResponse>> | Result<IResponse>;
}

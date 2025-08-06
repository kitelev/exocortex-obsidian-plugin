import { UIButton } from '../entities/UIButton';
import { ButtonCommand } from '../entities/ButtonCommand';
import { AssetId } from '../value-objects/AssetId';
import { Result } from '../core/Result';

/**
 * Repository interface for UI Buttons and Commands
 */
export interface IButtonRepository {
    /**
     * Find a button by ID
     */
    findButtonById(id: AssetId): Promise<Result<UIButton | null>>;

    /**
     * Find a command by ID
     */
    findCommandById(id: AssetId): Promise<Result<ButtonCommand | null>>;

    /**
     * Find all buttons
     */
    findAllButtons(): Promise<Result<UIButton[]>>;

    /**
     * Find all commands
     */
    findAllCommands(): Promise<Result<ButtonCommand[]>>;

    /**
     * Find buttons by their command ID
     */
    findButtonsByCommandId(commandId: AssetId): Promise<Result<UIButton[]>>;

    /**
     * Save or update a button
     */
    saveButton(button: UIButton): Promise<Result<void>>;

    /**
     * Save or update a command
     */
    saveCommand(command: ButtonCommand): Promise<Result<void>>;

    /**
     * Delete a button
     */
    deleteButton(id: AssetId): Promise<Result<void>>;

    /**
     * Delete a command
     */
    deleteCommand(id: AssetId): Promise<Result<void>>;
}
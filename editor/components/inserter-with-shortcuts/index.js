/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter, get, intersection, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { BlockIcon, createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { IconButton, withContext } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../inserter';
import { getFrecentInserterItems, getBlockInsertionPoint, getBlockListSettings } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

function InserterWithShortcuts( { items, isLocked, onToggle, onInsert } ) {
	if ( isLocked ) {
		return null;
	}

	const itemsWithoutDefaultBlock = filter( items, ( item ) =>
		item.name !== getDefaultBlockName() || ! isEmpty( item.initialAttributes )
	).slice( 0, 2 );

	return (
		<div className="editor-inserter-with-shortcuts">
			<Inserter
				position="top left"
				onToggle={ onToggle }
			/>

			{ itemsWithoutDefaultBlock.map( ( item ) => (
				<IconButton
					key={ item.id }
					className="editor-inserter-with-shortcuts__block"
					onClick={ () => onInsert( item ) }
					label={ sprintf( __( 'Add %s' ), item.title ) }
					icon={ (
						<BlockIcon icon={ item.icon } />
					) }
				/>
			) ) }
		</div>
	);
}

export default compose(
	withContext( 'editor' )( ( settings ) => {
		const { templateLock, blockTypes } = settings;
		return {
			isLocked: !! templateLock,
			globalEnabledBlockTypes: blockTypes,
		};
	} ),
	connect(
		( state, { globalEnabledBlockTypes } ) => {
			const insertionPoint = getBlockInsertionPoint( state );
			const { rootUID } = insertionPoint;
			const blockListSettings = getBlockListSettings( state, rootUID );
			const supportedNestedBlocks = get( blockListSettings, 'supportedBlocks' );

			let supportedBlockTypes;
			if ( ! supportedNestedBlocks ) {
				supportedBlockTypes = globalEnabledBlockTypes;
			} else if ( true === globalEnabledBlockTypes ) {
				supportedBlockTypes = supportedNestedBlocks;
			} else {
				supportedBlockTypes = intersection( globalEnabledBlockTypes, supportedNestedBlocks );
			}

			return {
				items: getFrecentInserterItems( state, supportedBlockTypes, 3 ),
			};
		},
		( dispatch, { uid, layout } ) => ( {
			onInsert( { name, initialAttributes } ) {
				const block = createBlock( name, { ...initialAttributes, layout } );
				return dispatch( replaceBlocks( uid, block ) );
			},
		} )
	),
)( InserterWithShortcuts );

import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { connect } from 'react-redux';
import { removeCurrentBlock } from '@/actions/posterPro';

const DeleteBlock = (props) => {
  const { removeCurrentBlock } = props;

  return <DeleteOutlineIcon onClick={removeCurrentBlock} />;
};

const mapStateToProps = (state) => {
  return {};
};

export default connect(mapStateToProps, { removeCurrentBlock })(DeleteBlock);

import { useState, FC, ChangeEvent, useEffect } from 'react';
import axiosBase, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';

import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Grid,
  IconButton,
  styled,
  TextField,
  Toolbar,
  Typography,
  Link,
} from '@mui/material';
import './App.css';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import PersonIcon from '@mui/icons-material/Person';

// ステータスコード
const STATUS_CODE = {
  OK: 200,

  BAD_REQUEST: 400,
  UNAUTHORISZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,

  INTERNAL_SERVER_ERROR: 500,
};

class AxiosUtil {
  axios: AxiosInstance;

  // コンストラクタでエラーをハンドリングする関数設定
  constructor() {
    this.axios = axiosBase.create({
      baseURL: import.meta.env.VITE_CLOUD_FUNCTION_URL,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      responseType: 'json',
    });

    // インターセプターを利用したエラー処理ハンドリング
    this.axios.interceptors.response.use(
      (response) => {
        // 成功時は普通にresponse返却
        return response;
      },
      (error: AxiosError) => {
        console.error(error);
        const status = error.response?.status || null;
        const statusText = error.response?.statusText || 'Server Error';
        const data: any = error.response?.data;
        const msg = data.msg || '不明なエラーが発生しました';

        // 404はNotFoundに飛ばす
        if (status === STATUS_CODE['NOT_FOUND']) {
          window.location.href = `404?status=${status}&statusText=${statusText}&msg=${msg}`;
          return;
        }

        // TODO:エラー内容を表示
      },
    );
  }

  async get(path: string, headers?: AxiosHeaders) {
    console.log(`axios get ${path.split('?')[0]}`);
    return await this.axios.get(path, { headers: headers });
  }

  async post(path: string, params?: object, headers?: object) {
    console.log(`axios post ${path}`);
    return await this.axios.post(path, params, headers);
  }
}

const axiosUtil = new AxiosUtil();

const App: FC = () => {
  type Haiku = {
    key: string;
    id: string | null;
    content: string;
    author: string | null;
    dataFrom: string | null;
  };
  type HaikuResponse = {
    id: string;
    content: string;
    author: string;
    data_from: string;
  };
  const haikuResponse2Json = (response: HaikuResponse): Haiku => {
    return {
      key: response.id,
      id: response.id,
      content: response.content,
      author: response.author,
      dataFrom: response.data_from,
    };
  };
  const getLocalStorageSelectedHaikus = () => {
    let haikus = [];
    const selectedHaikus = localStorage.getItem('selectedHaikus');
    if (selectedHaikus) {
      haikus = JSON.parse(selectedHaikus);
    }
    return haikus;
  };
  const [selectedHaikus, handleSelectedHaikus] = useState<Haiku[]>(
    getLocalStorageSelectedHaikus(),
  );
  const setSelectedHaikus = (selectedHaikus: Haiku[]) => {
    handleSelectedHaikus(selectedHaikus);
    localStorage.setItem('selectedHaikus', JSON.stringify(selectedHaikus));
  };
  const getLocalStorageSearchedHaikus = () => {
    let haikus = [];
    const searchedHaikus = localStorage.getItem('searchedHaikus');
    if (searchedHaikus) {
      haikus = JSON.parse(searchedHaikus);
    }
    return haikus;
  };
  const [searchedHaikus, handleSearchedHaikus] = useState<Haiku[]>(
    getLocalStorageSearchedHaikus(),
  );
  const setSearchedHaikus = (searchedHaikus: Haiku[]) => {
    handleSearchedHaikus(searchedHaikus);
    localStorage.setItem('searchedHaikus', JSON.stringify(searchedHaikus));
  };

  const deleteSelectedHaiku = (index: number) => {
    const deletedSelectedHaikus = selectedHaikus.filter((_h, i) => i !== index);
    setSelectedHaikus(deletedSelectedHaikus);
  };

  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const handleChangeContent = (e: ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };
  const handleChangeAuthor = (e: ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
  };

  const [word, setWord] = useState('');
  const handleChangeWord = (e: ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
  };
  const handleSearchButtonClick = () => {
    searchHaikus();
  };
  const searchHaikus = async () => {
    const response = await axiosUtil.get(`/search?word=${word}`);

    const haikusResponse: Haiku[] =
      response.data['searched_haikus'].map(haikuResponse2Json);
    setSearchedHaikus(haikusResponse);
  };

  const selectedHaikuIds = selectedHaikus.map((h) => h.id);
  const addHaiku = (haiku: Haiku) => {
    setSelectedHaikus([...selectedHaikus, haiku]);
  };
  //TODO: キャッシュから俳句取得したときに、tmpIdの最大値取得してidの初期値修正
  const tmpKeys = selectedHaikus
    .map((h) => h.key)
    .filter((key) => key.startsWith('tmp-'))
    .map((key) => Number(key.replace('tmp-', '')));
  const initTmpKeyCount = tmpKeys.length > 0 ? Math.max(...tmpKeys) + 1 : 0;
  const [tmpKeyCount, setTmpKeyCount] = useState(initTmpKeyCount);
  const addManualHaiku = () => {
    // TODO:バリデーション
    const manualHaiku = {
      key: 'tmp-' + tmpKeyCount,
      id: null,
      content: content,
      author: author || null,
      dataFrom: null,
    };
    setContent('');
    setAuthor('');
    setTmpKeyCount(tmpKeyCount + 1);
    addHaiku(manualHaiku);
  };

  const handleSuggestButtonClick = () => {
    suggestHaikus();
  };
  type SimpleHaiku = {
    id: string | null;
    content: string;
  };
  const suggestHaikus = async () => {
    const paramHaikus: SimpleHaiku[] = selectedHaikus.map((h) => {
      return { id: h.id, content: h.content };
    });
    const response = await axiosUtil.post('/suggest', {
      selected_haikus: paramHaikus,
    });

    const haikusResponse: Haiku[] =
      response.data['suggested_haikus'].map(haikuResponse2Json);
    setSearchedHaikus(haikusResponse);
  };

  type DataFromMaster = {
    [key: string]: { contentLink: string; authorLink: string };
  };
  const dataFromMaster: DataFromMaster = {
    'haiku-data.jp': {
      contentLink: 'https://haiku-data.jp/work_detail.php?cd=',
      authorLink: 'https://haiku-data.jp/author_work_list.php?author_name=',
    },
  };
  const getDataFromContentLink = (haiku: Haiku) => {
    if (!haiku.dataFrom) {
      return 'https://www.google.com/search?q=' + haiku.content;
    }
    // データ元のリンクを取得
    const dataFrom = dataFromMaster[haiku.dataFrom];
    if (!dataFrom) {
      return 'https://www.google.com/search?q=' + haiku.content;
    }

    return dataFrom.contentLink + haiku.id;
  };
  const getDataFromAuthorLink = (haiku: Haiku) => {
    if (!haiku.dataFrom) {
      return 'https://www.google.com/search?q=' + haiku.author;
    }
    // データ元のリンクを取得
    const dataFrom = dataFromMaster[haiku.dataFrom];
    if (!dataFrom) {
      return 'https://www.google.com/search?q=' + haiku.author;
    }

    return dataFrom.authorLink + haiku.author;
  };

  interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
  }
  const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
  })(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  }));
  const [expanded, setExpanded] = useState(true);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const fetchInitHaikus = async () => {
    const response = await axiosUtil.get('/init');
    if (searchedHaikus.length > 0) {
      return;
    }
    const haikusResponse: Haiku[] =
      response.data.haikus.map(haikuResponse2Json);
    setSearchedHaikus(haikusResponse);
  };
  useEffect(() => {
    if (searchedHaikus.length === 0) {
      fetchInitHaikus();
    }
  }, []);

  const dispSelectedHaikus = selectedHaikus.map((haiku, i) => (
    <Card key={haiku.id} sx={{ m: 1 }}>
      <CardContent>
        <Typography variant="h5">
          {haiku.content}
          <Link
            href={getDataFromContentLink(haiku)}
            rel="noreferrer"
            target="_blank"
            underline="hover"
            sx={{ ml: 1, verticalAlign: 'middle' }}
          >
            <ManageSearchIcon></ManageSearchIcon>
          </Link>
        </Typography>
      </CardContent>
      <CardContent sx={{ display: 'flex' }}>
        <Box sx={{ flexGrow: 1 }}>
          {haiku.author && (
            <Typography variant="h6">
              {haiku.author}
              <Link
                href={getDataFromAuthorLink(haiku)}
                rel="noreferrer"
                target="_blank"
                underline="hover"
                sx={{ ml: 1, verticalAlign: 'middle' }}
              >
                <PersonIcon></PersonIcon>
              </Link>
            </Typography>
          )}
        </Box>
        <Box>
          <IconButton
            onClick={() => deleteSelectedHaiku(i)}
            aria-label="delete"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  ));
  const dispSearchedHaikus = searchedHaikus.map((haiku) => (
    <Card key={haiku.id} sx={{ m: 1 }}>
      <CardContent>
        <Typography variant="h5">
          {haiku.content}
          {haiku.dataFrom && haiku.id && (
            <Link
              href={getDataFromContentLink(haiku)}
              rel="noreferrer"
              target="_blank"
              underline="hover"
              sx={{ ml: 1, verticalAlign: 'middle' }}
            >
              <ManageSearchIcon></ManageSearchIcon>
            </Link>
          )}
        </Typography>
      </CardContent>
      <CardContent sx={{ display: 'flex' }}>
        <Box sx={{ flexGrow: 1 }}>
          {haiku.author && (
            <Typography variant="h6">
              {haiku.author}
              <Link
                href={getDataFromAuthorLink(haiku)}
                rel="noreferrer"
                target="_blank"
                underline="hover"
                sx={{ ml: 1, verticalAlign: 'middle' }}
              >
                <PersonIcon></PersonIcon>
              </Link>
            </Typography>
          )}
        </Box>
        <Box>
          <IconButton
            onClick={() => addHaiku(haiku)}
            aria-label="add"
            color="primary"
            disabled={selectedHaikuIds.includes(haiku.id)}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  ));
  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {/* TODO: アイコン */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            hAIku
          </Typography>
        </Toolbar>
      </AppBar>

      <Grid container spacing={1} sx={{ p: 1 }}>
        <Grid item xs={12} sm={6}>
          <Grid container spacing={1} sx={{ p: 1 }}>
            <Grid item xs="auto">
              <ExpandMore
                expand={expanded}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show more"
              >
                <ExpandMoreIcon />
              </ExpandMore>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                選択した俳句
              </Typography>
            </Grid>
            <Grid item xs="auto">
              <Button
                aria-label="suggest"
                variant="contained"
                color="primary"
                disabled={selectedHaikus.length === 0}
                onClick={handleSuggestButtonClick}
              >
                AIで検索
              </Button>
            </Grid>
          </Grid>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {dispSelectedHaikus}
            <Card sx={{ m: 1 }}>
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <TextField
                      id="content"
                      fullWidth
                      size="small"
                      label="俳句"
                      value={content}
                      onChange={handleChangeContent}
                    ></TextField>
                  </Grid>
                  <Grid item xs>
                    <TextField
                      id="author"
                      fullWidth
                      size="small"
                      label="著者"
                      value={author}
                      onChange={handleChangeAuthor}
                    ></TextField>
                  </Grid>
                  <Grid item xs="auto">
                    <IconButton
                      aria-label="delete"
                      color="primary"
                      disabled={!content}
                      onClick={() => addManualHaiku()}
                    >
                      <AddIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Grid container spacing={1} sx={{ p: 1 }}>
            <Grid item xs>
              <TextField
                id="word"
                size="small"
                fullWidth
                label="単語・著者名で検索"
                value={word}
                onChange={handleChangeWord}
              ></TextField>
            </Grid>
            <Grid item xs="auto">
              <IconButton
                onClick={handleSearchButtonClick}
                aria-label="search"
                color="inherit"
                disabled={!word}
              >
                <SearchIcon />
              </IconButton>
            </Grid>
          </Grid>
          {/* TODO: 検索俳句*/}
          <Box>
            <Typography variant="h6">検索結果</Typography>
            {dispSearchedHaikus}
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default App;

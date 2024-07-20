import { useState, FC, ChangeEvent, useEffect, MouseEvent } from 'react';
import axiosBase, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';

import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import './App.css';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';

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
    id: string;
    content: string;
    author: string | null;
    dataFrom: string | null;
  };
  const [selectedHaikus, setSelectedHaikus] = useState<Haiku[]>([
    {
      id: '12345',
      content: 'あいうえおかきくけこさしすせそたち',
      author: '佐藤航',
      dataFrom: 'haiku',
    },
    {
      id: 'aaaaaaaaaa',
      content: 'あいうえおかきくけこさしすせそたち',
      author: null,
      dataFrom: null,
    },
  ]);
  const [searchedHaikus, selectedSearchedHaikus] = useState<Haiku[]>([
    {
      id: '112345',
      content: 'あああああああああああああああああ',
      author: '佐藤航',
      dataFrom: 'haiku',
    },
  ]);

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

  const addHaiku = (haiku: Haiku) => {
    setSelectedHaikus([...selectedHaikus, haiku]);
  };
  const [tmpIdCount, setTmpIdCount] = useState(0);
  //TODO: キャッシュから俳句取得したときに、tmpIdの最大値取得してidの初期値修正
  const addManualHaiku = () => {
    // TODO:バリデーション
    const manualHaiku = {
      id: 'tmp-' + tmpIdCount,
      content: content,
      author: author || null,
      dataFrom: null,
    };
    setContent('');
    setAuthor('');
    setTmpIdCount(tmpIdCount + 1);
    addHaiku(manualHaiku);
  };

  const dispSelectedHaikus = selectedHaikus.map((haiku, i) => (
    <Card key={haiku.id} sx={{ m: 1 }}>
      <CardContent>
        <Typography variant="h5">
          {haiku.content}
          {haiku.dataFrom && haiku.id && <span>俳句リンク</span>}
        </Typography>
      </CardContent>
      <CardContent sx={{ display: 'flex' }}>
        <Box sx={{ flexGrow: 1 }}>
          {haiku.author && (
            <Typography variant="h6">
              {haiku.author}
              <span>著者リンク</span>
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
  const dispSearchedHaikus = searchedHaikus.map((haiku, i) => (
    <Card key={haiku.id} sx={{ m: 1 }}>
      <CardContent>
        <Typography variant="h5">
          {haiku.content}
          {haiku.dataFrom && haiku.id && <span>俳句リンク</span>}
        </Typography>
      </CardContent>
      <CardContent sx={{ display: 'flex' }}>
        <Box sx={{ flexGrow: 1 }}>
          {haiku.author && (
            <Typography variant="h6">
              {haiku.author}
              <span>著者リンク</span>
            </Typography>
          )}
        </Box>
        <Box>
          <IconButton
            onClick={() => addHaiku(haiku)}
            aria-label="add"
            color="primary"
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
          {/* TODO:閉じるボタン */}
          <Grid container spacing={1} sx={{ p: 1 }}>
            <Grid item xs>
              <IconButton aria-label="close" color="inherit">
                <KeyboardArrowDownIcon />
              </IconButton>
            </Grid>
            <Grid item xs="auto">
              <Button aria-label="suggest" variant="contained" color="primary">
                AIで検索
              </Button>
            </Grid>
          </Grid>
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
                    onClick={() => addManualHaiku()}
                  >
                    <AddIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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
              <IconButton aria-label="search" color="inherit">
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
